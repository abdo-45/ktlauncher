# KTLauncher Third-Party Services & Network Boundary Specification

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-22  
**Target Build:** KTLauncher v1.0.1 (Asar v20)

---

## 1. Permitted Authoritative Services

The following external services are strictly permitted for game functionality, content browsing, and modloader resolution:

### 1.1 Mojang / Microsoft Services
- `https://piston-meta.mojang.com`: Minecraft version manifests.
- `https://launchermeta.mojang.com`: Official Mojang Java Runtime metadata.
- `https://libraries.minecraft.net`: Official client and server Java libraries.
- `https://resources.download.minecraft.net`: Minecraft vanilla assets and textures.
- `https://sessionserver.mojang.com`: Verification of official Mojang/Microsoft account skins.
- `https://api.minecraftservices.com`: Microsoft OAuth token exchange and player profile data (only contacted when a Microsoft account is explicitly authenticated).

### 1.2 Upstream Mod Repositories & APIs
- `https://api.modrinth.com/v2`: Modrinth mod, modpack, and shader catalog.
- `https://api.curseforge.com/v1`: CurseForge mod and modpack catalog.
- `https://meta.fabricmc.net/v2`: Fabric loader metadata.
- `https://meta.quiltmc.org/v3`: Quilt loader metadata.
- `https://maven.minecraftforge.net`: Official Minecraft Forge Maven.
- `https://maven.neoforged.net`: Official NeoForged Maven.

### 1.3 Canonical Release & Update Channels
- `https://api.github.com/repos/abdo-45/ktlauncher/releases/latest`: Canonical update manifest.
- Direct binary downloads hosted on GitHub Releases (`github.com/abdo-45/ktlauncher/releases/download/...`).

---

## 2. Completely Eliminated / Decoupled Endpoints

The following third-party infrastructure has been completely severed and replaced:

| Former Endpoint | Status | Replacement Mechanism |
| :--- | :--- | :--- |
| `meta.skmedix.pl/v1/launcher/config.json` | **ELIMINATED** | Local first-party `providers.json` |
| `meta.skmedix.pl/v1/launcher/library-patches.json`| **ELIMINATED** | Local verified static patches |
| `meta.skmedix.pl/maven/...` | **ELIMINATED** | Upstream Maven Central (`repo1.maven.org`) & Mojang library CDN |
| `beta.skmedix.pl/news.json` | **ELIMINATED** | Canonical `providers.json` news feed |
| `updates.skmedix.pl` | **ELIMINATED** | Canonical `abdo-45/ktlauncher` Releases |
| `sessionserver.skmedix.pl/profile/secure` | **ELIMINATED** | In-process Java Agent stream interceptor |
| `files.skmedix.pl` / `s2.skmedix.pl` | **ELIMINATED** | First-party `ktlauncher-agent.jar` (Ed25519 verified) |
| `cdn.xyrios.com` / `xyrios.com` | **DECOUPLED** | Configurable community servers provider adapter with offline fallback |
