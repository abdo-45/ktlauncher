# KTLauncher Phase 3 — IPC Channel Inventory & Security Audit

Date: 2026-11-22
Total Registered Handlers: 236

## Summary
- Request/Response (`ipcMain.handle`): 232
- Event Listeners (`ipcMain.on`): 4

## 1. Request / Response Channels (`ipcMain.handle`)
| Channel | Category | Validation / Risk Mitigation |
|---|---|---|
| `analytics:track` | analytics | Strict type validation & sender verification |
| `app:get-gpu-status` | app | Strict type validation & sender verification |
| `app:get-memory-info` | app | Strict type validation & sender verification |
| `app:get-os-info` | app | Strict type validation & sender verification |
| `app:get-version` | app | Strict type validation & sender verification |
| `app:restart` | app | Strict type validation & sender verification |
| `app:share-launcher-log` | app | No shell execution, argument array validation |
| `app:share-launcher-log_old` | app | No shell execution, argument array validation |
| `auth:cancel-microsoft-login` | auth | Isolated token handling, zero credentials leak |
| `auth:get-accounts` | auth | Isolated token handling, zero credentials leak |
| `auth:get-active-account` | auth | Isolated token handling, zero credentials leak |
| `auth:initialize` | auth | Isolated token handling, zero credentials leak |
| `auth:is-token-expired` | auth | Isolated token handling, zero credentials leak |
| `auth:login-microsoft` | auth | Isolated token handling, zero credentials leak |
| `auth:login-offline` | auth | Isolated token handling, zero credentials leak |
| `auth:logout` | auth | Isolated token handling, zero credentials leak |
| `auth:refresh-token` | auth | Isolated token handling, zero credentials leak |
| `auth:switch-account` | auth | Isolated token handling, zero credentials leak |
| `cape:equip` | cape | Strict type validation & sender verification |
| `cape:unequip` | cape | Strict type validation & sender verification |
| `console:open` | console | File path sanitization, no arbitrary escape from app data dir |
| `content:apply-modpack-update` | content | Strict type validation & sender verification |
| `content:apply-updates` | content | Strict type validation & sender verification |
| `content:bulk-remove` | content | Strict type validation & sender verification |
| `content:bulk-set-enabled` | content | Strict type validation & sender verification |
| `content:check-modpack-update` | content | Strict type validation & sender verification |
| `content:check-updates` | content | Strict type validation & sender verification |
| `content:copy-to-instance` | content | Strict type validation & sender verification |
| `content:curseforge-get-api-key` | content | Strict type validation & sender verification |
| `content:curseforge-get-categories` | content | Strict type validation & sender verification |
| `content:curseforge-get-changelog` | content | Strict type validation & sender verification |
| `content:curseforge-get-download-url` | content | Strict type validation & sender verification |
| `content:curseforge-get-project` | content | Strict type validation & sender verification |
| `content:curseforge-get-versions` | content | Strict type validation & sender verification |
| `content:curseforge-match-fingerprints` | content | Strict type validation & sender verification |
| `content:curseforge-search` | content | Strict type validation & sender verification |
| `content:curseforge-set-api-key` | content | Strict type validation & sender verification |
| `content:find-duplicate-mods` | content | Strict type validation & sender verification |
| `content:get-cached-updates` | content | Strict type validation & sender verification |
| `content:get-manifest` | content | Strict type validation & sender verification |
| `content:get-modpack-link` | content | Strict type validation & sender verification |
| `content:import-unmanaged` | content | Strict type validation & sender verification |
| `content:install-content` | content | Strict type validation & sender verification |
| `content:install-mod` | content | Strict type validation & sender verification |
| `content:modrinth-batch-check-updates` | content | Strict type validation & sender verification |
| `content:modrinth-get-categories` | content | Strict type validation & sender verification |
| `content:modrinth-get-changelog` | content | Strict type validation & sender verification |
| `content:modrinth-get-project` | content | Strict type validation & sender verification |
| `content:modrinth-get-version` | content | Strict type validation & sender verification |
| `content:modrinth-get-version-from-hash` | content | Strict type validation & sender verification |
| `content:modrinth-get-versions` | content | Strict type validation & sender verification |
| `content:modrinth-search` | content | Strict type validation & sender verification |
| `content:preview-modpack-update` | content | Strict type validation & sender verification |
| `content:refresh-instance` | content | Strict type validation & sender verification |
| `content:reinstall-missing` | content | Strict type validation & sender verification |
| `content:remove-content` | content | Strict type validation & sender verification |
| `content:remove-from-manifest` | content | Strict type validation & sender verification |
| `content:remove-mod` | content | Strict type validation & sender verification |
| `content:resolve-dependencies` | content | Strict type validation & sender verification |
| `content:scan-identify-content` | content | Strict type validation & sender verification |
| `content:servers-list` | content | Strict type validation & sender verification |
| `content:servers-status` | content | Strict type validation & sender verification |
| `content:set-modpack-locked` | content | Strict type validation & sender verification |
| `content:sync-with-disk` | content | Strict type validation & sender verification |
| `content:toggle-content` | content | Strict type validation & sender verification |
| `content:toggle-mod` | content | Strict type validation & sender verification |
| `content:unlink-modpack` | content | Strict type validation & sender verification |
| `content:verify-and-repair` | content | Strict type validation & sender verification |
| `content:worlds-copy` | content | Strict type validation & sender verification |
| `content:worlds-delete` | content | Strict type validation & sender verification |
| `content:worlds-list` | content | Strict type validation & sender verification |
| `content:worlds-move` | content | Strict type validation & sender verification |
| `data-dir:change` | data-dir | Strict type validation & sender verification |
| `data-dir:get` | data-dir | Strict type validation & sender verification |
| `data-dir:recover` | data-dir | Strict type validation & sender verification |
| `dialog:open-directory` | dialog | File path sanitization, no arbitrary escape from app data dir |
| `dialog:open-file` | dialog | File path sanitization, no arbitrary escape from app data dir |
| `friends:attributes:get` | friends | Strict type validation & sender verification |
| `friends:attributes:set` | friends | Strict type validation & sender verification |
| `friends:blocklist` | friends | Strict type validation & sender verification |
| `friends:cached` | friends | Strict type validation & sender verification |
| `friends:list` | friends | Strict type validation & sender verification |
| `friends:mutate` | friends | Strict type validation & sender verification |
| `friends:presence:get` | friends | Strict type validation & sender verification |
| `friends:setPanelOpen` | friends | Strict type validation & sender verification |
| `game:apply-crash-fix` | game | Strict type validation & sender verification |
| `game:get-default-jvm-args` | game | Strict type validation & sender verification |
| `game:get-log` | game | Strict type validation & sender verification |
| `game:get-recommended-java-component` | game | Strict type validation & sender verification |
| `game:get-running` | game | Strict type validation & sender verification |
| `game:get-session` | game | Strict type validation & sender verification |
| `game:get-state` | game | Strict type validation & sender verification |
| `game:install` | game | Strict type validation & sender verification |
| `game:is-installed` | game | Strict type validation & sender verification |
| `game:is-running` | game | Strict type validation & sender verification |
| `game:launch` | game | No shell execution, argument array validation |
| `game:launch-quickplay` | game | No shell execution, argument array validation |
| `game:open-crash-report` | game | File path sanitization, no arbitrary escape from app data dir |
| `game:repair` | game | Strict type validation & sender verification |
| `game:share-crash-report` | game | Strict type validation & sender verification |
| `game:share-crash-report_old` | game | Strict type validation & sender verification |
| `game:share-log` | game | Strict type validation & sender verification |
| `game:share-log_old` | game | Strict type validation & sender verification |
| `game:stop` | game | Strict type validation & sender verification |
| `game:stop-all` | game | Strict type validation & sender verification |
| `installation:apply-skpack-update` | installation | Strict type validation & sender verification |
| `installation:cancel` | installation | Strict type validation & sender verification |
| `installation:get-all` | installation | Strict type validation & sender verification |
| `installation:get-status` | installation | Strict type validation & sender verification |
| `installation:import-mmc-pack` | installation | Strict type validation & sender verification |
| `installation:import-modpack` | installation | Strict type validation & sender verification |
| `installation:import-optifine` | installation | Strict type validation & sender verification |
| `installation:preview-modpack-file` | installation | File path sanitization, no arbitrary escape from app data dir |
| `installation:preview-optifine-file` | installation | File path sanitization, no arbitrary escape from app data dir |
| `installation:preview-skpack-update` | installation | Strict type validation & sender verification |
| `installation:start-modpack` | installation | Strict type validation & sender verification |
| `instance:keybinds:get` | instance | Strict type validation & sender verification |
| `instance:keybinds:save` | instance | Strict type validation & sender verification |
| `instances:allocate-id` | instances | Strict type validation & sender verification |
| `instances:change-version` | instances | Strict type validation & sender verification |
| `instances:copy-screenshot` | instances | Strict type validation & sender verification |
| `instances:create` | instances | Strict type validation & sender verification |
| `instances:create-shortcut` | instances | Strict type validation & sender verification |
| `instances:delete` | instances | Strict type validation & sender verification |
| `instances:delete-file` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:delete-mod` | instances | Strict type validation & sender verification |
| `instances:duplicate` | instances | Strict type validation & sender verification |
| `instances:export-skpack` | instances | Strict type validation & sender verification |
| `instances:export-skpack-preview` | instances | Strict type validation & sender verification |
| `instances:fetch-icon-bytes` | instances | Strict type validation & sender verification |
| `instances:get` | instances | Strict type validation & sender verification |
| `instances:get-default-version-id` | instances | Strict type validation & sender verification |
| `instances:get-version` | instances | Strict type validation & sender verification |
| `instances:import-analyze-shared` | instances | Strict type validation & sender verification |
| `instances:import-default-path` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:import-detect-sklauncher3` | instances | No shell execution, argument array validation |
| `instances:import-files` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:import-list` | instances | Strict type validation & sender verification |
| `instances:import-run` | instances | Strict type validation & sender verification |
| `instances:initialize` | instances | Strict type validation & sender verification |
| `instances:list` | instances | Strict type validation & sender verification |
| `instances:list-files` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:list-mods` | instances | Strict type validation & sender verification |
| `instances:list-screenshots` | instances | Strict type validation & sender verification |
| `instances:open-directory` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:purge` | instances | Strict type validation & sender verification |
| `instances:rename-file` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:resolve-path` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:resolve-version` | instances | Strict type validation & sender verification |
| `instances:reveal-file` | instances | File path sanitization, no arbitrary escape from app data dir |
| `instances:save-screenshot-as` | instances | Strict type validation & sender verification |
| `instances:toggle-mod` | instances | Strict type validation & sender verification |
| `instances:update` | instances | Strict type validation & sender verification |
| `java:delete` | java | Strict type validation & sender verification |
| `java:get-all-components` | java | Strict type validation & sender verification |
| `java:get-available` | java | Strict type validation & sender verification |
| `java:get-disk-usage` | java | Strict type validation & sender verification |
| `java:get-executable-path` | java | File path sanitization, no arbitrary escape from app data dir |
| `java:get-info` | java | Strict type validation & sender verification |
| `java:get-installed` | java | Strict type validation & sender verification |
| `java:get-installed-version` | java | Strict type validation & sender verification |
| `java:get-provider` | java | Strict type validation & sender verification |
| `java:get-source-preferences` | java | Strict type validation & sender verification |
| `java:install` | java | Strict type validation & sender verification |
| `java:is-available` | java | Strict type validation & sender verification |
| `java:is-installed` | java | Strict type validation & sender verification |
| `java:set-source-preference` | java | Strict type validation & sender verification |
| `java:verify` | java | Strict type validation & sender verification |
| `jumplist:set-recents` | jumplist | Strict type validation & sender verification |
| `news:fetch` | news | Strict type validation & sender verification |
| `notifications:supported` | notifications | Strict type validation & sender verification |
| `playtime:get-summary` | playtime | Strict type validation & sender verification |
| `quickplay:clear-all-data` | quickplay | Strict type validation & sender verification |
| `quickplay:get-instances` | quickplay | Strict type validation & sender verification |
| `quickplay:get-world-icon` | quickplay | Strict type validation & sender verification |
| `quickplay:remove-instance` | quickplay | Strict type validation & sender verification |
| `quickplay:set-pinned` | quickplay | Strict type validation & sender verification |
| `quickplay:update-instance` | quickplay | Strict type validation & sender verification |
| `remote:config-fetch` | remote | Strict type validation & sender verification |
| `security:repair-hosts` | security | Strict type validation & sender verification |
| `security:run-manual-scan` | security | Strict type validation & sender verification |
| `security:scan-hosts` | security | Strict type validation & sender verification |
| `security:scan-system` | security | Strict type validation & sender verification |
| `security:threat-acknowledge` | security | Strict type validation & sender verification |
| `security:threat-quit` | security | Strict type validation & sender verification |
| `servers:fetch` | servers | Strict type validation & sender verification |
| `servers:fetchOne` | servers | Strict type validation & sender verification |
| `servers:install-modpack` | servers | Strict type validation & sender verification |
| `servers:trackIpCopy` | servers | Strict type validation & sender verification |
| `settings:get` | settings | Strict type validation & sender verification |
| `settings:get-all` | settings | Strict type validation & sender verification |
| `settings:get-auto-launch` | settings | No shell execution, argument array validation |
| `settings:set` | settings | Strict type validation & sender verification |
| `skin-preset:create` | skin-preset | Strict type validation & sender verification |
| `skin-preset:get-texture` | skin-preset | Strict type validation & sender verification |
| `skin-preset:list` | skin-preset | Strict type validation & sender verification |
| `skin-preset:remove` | skin-preset | Strict type validation & sender verification |
| `skin-preset:reorder` | skin-preset | Strict type validation & sender verification |
| `skin-preset:update` | skin-preset | Strict type validation & sender verification |
| `skin:apply` | skin | Strict type validation & sender verification |
| `skin:current-texture-id` | skin | Strict type validation & sender verification |
| `skin:fetch-texture` | skin | Strict type validation & sender verification |
| `skin:force-refresh` | skin | Strict type validation & sender verification |
| `skin:get` | skin | Strict type validation & sender verification |
| `skin:get-cape` | skin | Strict type validation & sender verification |
| `skin:get-profile` | skin | File path sanitization, no arbitrary escape from app data dir |
| `skin:refresh-active` | skin | Strict type validation & sender verification |
| `skin:reset` | skin | Strict type validation & sender verification |
| `skin:upload` | skin | Strict type validation & sender verification |
| `storage:clear-cache` | storage | Strict type validation & sender verification |
| `storage:clear-shared` | storage | Strict type validation & sender verification |
| `storage:compute-sizes` | storage | Strict type validation & sender verification |
| `storage:get-summary` | storage | Strict type validation & sender verification |
| `system:open-external` | system | File path sanitization, no arbitrary escape from app data dir |
| `theme:set-source` | theme | Strict type validation & sender verification |
| `updater:cancel-auto-restart` | updater | Strict type validation & sender verification |
| `updater:check-now` | updater | Strict type validation & sender verification |
| `updater:clear-cache-and-retry` | updater | Strict type validation & sender verification |
| `updater:download-and-install` | updater | Strict type validation & sender verification |
| `updater:get-state` | updater | Strict type validation & sender verification |
| `updater:install-and-restart` | updater | Strict type validation & sender verification |
| `updater:move-to-applications` | updater | Strict type validation & sender verification |
| `updater:open-manual-download` | updater | File path sanitization, no arbitrary escape from app data dir |
| `updater:retry-install` | updater | Strict type validation & sender verification |
| `updater:set-channel` | updater | Strict type validation & sender verification |
| `versions:clear-cache` | versions | Strict type validation & sender verification |
| `versions:get-local` | versions | Strict type validation & sender verification |
| `versions:get-modded` | versions | Strict type validation & sender verification |
| `versions:get-vanilla` | versions | Strict type validation & sender verification |
| `window:close` | window | Strict type validation & sender verification |
| `window:maximize` | window | Strict type validation & sender verification |
| `window:minimize` | window | Strict type validation & sender verification |

## 2. Event Listener Channels (`ipcMain.on`)
| Channel | Category | Validation / Risk Mitigation |
|---|---|---|
| `migration:get-initial-state-sync` | migration | Strict type validation |
| `notifications:show` | notifications | Strict type validation |
| `ping` | ping | Strict type validation |
| `updater:get-initial-state-sync` | updater | Strict type validation |