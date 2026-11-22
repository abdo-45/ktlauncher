package net.ktlauncher.agent;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.instrument.Instrumentation;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.net.URLStreamHandlerFactory;
import java.nio.charset.StandardCharsets;
import java.security.Security;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * KTLauncherAgent - First-party, clean-room Java Agent for KTLauncher.
 * Provides offline skin injection, LAN multiplayer compatibility, and DNS protections
 * without third-party server dependencies or background daemon threads.
 */
public class KTLauncherAgent {

    public static final String VERSION = "1.0.0";
    public static final String VIRTUAL_HOST = "ktlauncher.local";
    private static File skinsDir = null;
    private static final Map<String, byte[]> memorySkinCache = Collections.synchronizedMap(new HashMap<String, byte[]>());

    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("[KTLauncher] Initializing KTLauncher Java Agent v" + VERSION + "...");

        try {
            resolveSkinsDirectory();
            installUrlHook();
            applyNetworkTweaks();
            System.out.println("[KTLauncher] Agent initialized successfully (Threadless In-Process Mode).");
        } catch (Throwable t) {
            System.err.println("[KTLauncher] Error initializing agent: " + t.getMessage());
            t.printStackTrace(System.err);
        }
    }

    public static void agentmain(String agentArgs, Instrumentation inst) {
        premain(agentArgs, inst);
    }

    private static void resolveSkinsDirectory() {
        String customDir = System.getProperty("ktlauncher.skins.dir");
        if (customDir != null && !customDir.isEmpty()) {
            skinsDir = new File(customDir);
        } else {
            String appData = System.getenv("APPDATA");
            if (appData != null && !appData.isEmpty()) {
                skinsDir = new File(appData, ".ktlauncher" + File.separator + "skins");
            } else {
                String userHome = System.getProperty("user.home", ".");
                skinsDir = new File(userHome, ".ktlauncher" + File.separator + "skins");
            }
        }
        System.out.println("[KTLauncher] Skins directory: " + (skinsDir != null ? skinsDir.getAbsolutePath() : "null"));
    }

    public static byte[] getSkinData(String uuid) {
        String cleanUuid = uuid.replace("-", "").toLowerCase();
        if (memorySkinCache.containsKey(cleanUuid)) {
            return memorySkinCache.get(cleanUuid);
        }

        if (skinsDir != null && skinsDir.exists()) {
            // Direct file: skins/<uuid>
            File direct = new File(skinsDir, cleanUuid);
            if (direct.exists() && direct.isFile()) {
                byte[] d = readFile(direct);
                if (d != null) return d;
            }
            // Subfolder structure: skins/<first-2-chars>/<uuid>
            if (cleanUuid.length() >= 2) {
                File sub = new File(skinsDir, cleanUuid.substring(0, 2) + File.separator + cleanUuid);
                if (sub.exists() && sub.isFile()) {
                    byte[] d = readFile(sub);
                    if (d != null) return d;
                }
            }
        }
        return null;
    }

    private static byte[] readFile(File f) {
        try {
            FileInputStream fis = new FileInputStream(f);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int read;
            while ((read = fis.read(buf)) != -1) {
                baos.write(buf, 0, read);
            }
            fis.close();
            byte[] data = baos.toByteArray();
            baos.close();
            return data;
        } catch (Exception e) {
            return null;
        }
    }

    private static void installUrlHook() {
        try {
            Field factoryField = URL.class.getDeclaredField("factory");
            factoryField.setAccessible(true);
            final URLStreamHandlerFactory existingFactory = (URLStreamHandlerFactory) factoryField.get(null);

            URL.setURLStreamHandlerFactory(new URLStreamHandlerFactory() {
                @Override
                public URLStreamHandler createURLStreamHandler(String protocol) {
                    if ("https".equalsIgnoreCase(protocol) || "http".equalsIgnoreCase(protocol)) {
                        return new InterceptingURLStreamHandler(protocol, existingFactory);
                    }
                    if (existingFactory != null) {
                        return existingFactory.createURLStreamHandler(protocol);
                    }
                    return null;
                }
            });
            System.out.println("[KTLauncher] URLStreamHandlerFactory registered for session intercept.");
        } catch (Throwable t) {
            System.out.println("[KTLauncher] Notice: URL stream handler factory already set, using fallback property.");
        }
    }

    private static void applyNetworkTweaks() {
        if (Boolean.getBoolean("ktlauncher.lan")) {
            System.setProperty("java.net.preferIPv4Stack", "true");
            System.out.println("[KTLauncher] LAN optimization enabled (IPv4 preferred).");
        }

        if (Boolean.getBoolean("ktlauncher.dns")) {
            Security.setProperty("networkaddress.cache.ttl", "60");
            Security.setProperty("networkaddress.cache.negative.ttl", "10");
            System.out.println("[KTLauncher] DNS cache security configuration applied.");
        }
    }

    /**
     * Intercepting Stream Handler that routes skin and profile requests in-memory.
     */
    private static class InterceptingURLStreamHandler extends URLStreamHandler {
        private final String protocol;
        private final URLStreamHandlerFactory fallbackFactory;

        public InterceptingURLStreamHandler(String protocol, URLStreamHandlerFactory fallbackFactory) {
            this.protocol = protocol;
            this.fallbackFactory = fallbackFactory;
        }

        @Override
        protected URLConnection openConnection(URL u) throws IOException {
            String host = u.getHost();
            String path = u.getPath();

            // 1. Intercept Virtual Skin Texture Endpoint: http://ktlauncher.local/skin/<uuid>.png
            if (host != null && host.equalsIgnoreCase(VIRTUAL_HOST) && path != null && path.startsWith("/skin/")) {
                int lastSlash = path.lastIndexOf('/');
                String uuidParam = path.substring(lastSlash + 1).replace(".png", "").replace("-", "");
                byte[] skinBytes = getSkinData(uuidParam);
                if (skinBytes != null && skinBytes.length > 0) {
                    return new MockSkinConnection(u, skinBytes);
                }
            }

            // 2. Intercept Mojang Session Server Profile Lookup: /session/minecraft/profile/<uuid>
            if (host != null && host.contains("sessionserver.mojang.com") && path != null && path.contains("/session/minecraft/profile/")) {
                int lastSlash = path.lastIndexOf('/');
                if (lastSlash != -1) {
                    String uuidParam = path.substring(lastSlash + 1).replace("-", "");
                    byte[] skinBytes = getSkinData(uuidParam);
                    if (skinBytes != null && skinBytes.length > 0) {
                        return new MockProfileConnection(u, uuidParam);
                    }
                }
            }

            // Default upstream connection
            return createDefaultConnection(u);
        }

        private URLConnection createDefaultConnection(URL u) throws IOException {
            try {
                String handlerClassName = "sun.net.www.protocol." + protocol + ".Handler";
                Class<?> handlerClass = Class.forName(handlerClassName);
                URLStreamHandler defaultHandler = (URLStreamHandler) handlerClass.getDeclaredConstructor().newInstance();
                Method openConnMethod = URLStreamHandler.class.getDeclaredMethod("openConnection", URL.class);
                openConnMethod.setAccessible(true);
                return (URLConnection) openConnMethod.invoke(defaultHandler, u);
            } catch (Exception e) {
                throw new IOException("Failed to create default connection for " + u, e);
            }
        }
    }

    /**
     * In-memory HTTP connection returning PNG image bytes.
     */
    private static class MockSkinConnection extends HttpURLConnection {
        private final byte[] imageBytes;

        protected MockSkinConnection(URL url, byte[] imageBytes) {
            super(url);
            this.imageBytes = imageBytes;
        }

        @Override public void connect() { this.connected = true; }
        @Override public int getResponseCode() { return 200; }
        @Override public String getContentType() { return "image/png"; }
        @Override public int getContentLength() { return imageBytes.length; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(imageBytes); }
        @Override public void disconnect() {}
        @Override public boolean usingProxy() { return false; }
    }

    /**
     * In-memory HTTP connection synthesizing Yggdrasil Profile JSON.
     */
    private static class MockProfileConnection extends HttpURLConnection {
        private final String uuid;
        private byte[] responseBytes = null;

        protected MockProfileConnection(URL url, String uuid) {
            super(url);
            this.uuid = uuid;
        }

        @Override
        public void connect() {
            this.connected = true;
            generateResponse();
        }

        private void generateResponse() {
            if (responseBytes != null) return;

            long timestamp = System.currentTimeMillis();
            String skinUrl = "http://" + VIRTUAL_HOST + "/skin/" + uuid + ".png";

            String texturesJson = "{"
                    + "\"timestamp\":" + timestamp + ","
                    + "\"profileId\":\"" + uuid + "\","
                    + "\"profileName\":\"KTPlayer\","
                    + "\"textures\":{"
                    + "\"SKIN\":{\"url\":\"" + skinUrl + "\",\"metadata\":{\"model\":\"classic\"}}"
                    + "}"
                    + "}";

            String encodedTextures = Base64.getEncoder().encodeToString(texturesJson.getBytes(StandardCharsets.UTF_8));

            String profileJson = "{"
                    + "\"id\":\"" + uuid + "\","
                    + "\"name\":\"KTPlayer\","
                    + "\"properties\":["
                    + "{\"name\":\"textures\",\"value\":\"" + encodedTextures + "\"}"
                    + "]"
                    + "}";

            responseBytes = profileJson.getBytes(StandardCharsets.UTF_8);
        }

        @Override public int getResponseCode() { return 200; }
        @Override public String getContentType() { return "application/json"; }
        @Override public int getContentLength() { generateResponse(); return responseBytes.length; }
        @Override public InputStream getInputStream() { generateResponse(); return new ByteArrayInputStream(responseBytes); }
        @Override public void disconnect() {}
        @Override public boolean usingProxy() { return false; }
    }
}
