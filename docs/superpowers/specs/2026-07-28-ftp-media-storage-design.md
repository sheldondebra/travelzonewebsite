# FTP / cPanel Media Storage Design

**Date:** 2026-07-28  
**Status:** Approved — implement

## Goal

Let admins connect a cPanel FTP/FTPS account in Settings, test the connection (create/list an images folder), and use that storage as the primary destination for admin image uploads. Fall back to Vercel Blob, then local `public/media`.

## Decisions

- Prefer FTP when connected; else Blob; else local
- Custom public base URL in Settings
- FTP / FTPS only (no SFTP)
- Connection health only (no disk quota) — connect, ensure folder, list folder

## Settings UI

New **Media** tab:

- Status: Connected / Not connected / Error
- Fields: enabled, host, port (21), username, password (masked), FTPS toggle, remote folder (`public_html/media`), public base URL
- Actions: Save, Test connection, Disconnect
- Test success creates remote folder if missing and confirms listing

## Upload flow

1. Compress WebP  
2. If FTP ready (`enabled` + credentials + `lastTestOk`) → upload via FTPS/FTP  
3. Else Blob token → Vercel Blob  
4. Else local `public/media` (non-serverless)  
5. FTP upload failure surfaces error (no silent mid-upload fallback)

Remote layout: `{remoteFolder}/{blog|tours|team|uploads}/...`

## Data model (`site_settings.data.ftp`)

```
enabled, host, port, username, password, secure,
remoteFolder, publicBaseUrl,
lastTestAt, lastTestOk, lastTestMessage
```

Password never returned to the client (only `hasPassword`).

## Security

- Admin-only save/test/disconnect
- Preserve password when blank on save
- FTP client timeouts
- Changing host/user/folder resets `lastTestOk` until re-tested
