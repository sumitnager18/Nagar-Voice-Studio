# Nagar Studio V2 — Unified Media Architecture

## Product decision
Nagar Voice Studio is the primary application and orchestration layer. The previous repositories are specialized modules.

| Repository | Role |
|---|---|
| Nagar-Voice-Studio | Primary desktop/web production workstation and media core |
| CGH-Story-Studio | Story, scene, asset and timeline engine |
| CGH-Local-LipSync-Studio | Local Wav2Lip/MuseTalk engine service |
| Hindi-Text-to-Speech-Converter | Focused Hindi workflow and UI reference |
| Text-to-Audio | Android/mobile client |

## Runtime rule
Configuration is not capability.
A module may report configured, available, or verified. Hardware acceleration, model availability and inference readiness must only be reported as verified after a runtime probe succeeds.

## Core flow
Script -> normalization -> pronunciation resolution -> voice/provider selection -> capability verification -> queued media job -> speech generation -> audio normalization/mastering -> optional lip-sync -> story/timeline integration -> export

## Engineering changes
- Added shared capability schema and local-worker contract.
- Replaced the local TTS provider's fake success path with a real worker call.
- Local voices are discovered from worker capabilities instead of hardcoded as available.
- Added runtime FFmpeg discovery and a unified suite capability endpoint.
- Added Media Suite dashboard, engine registry, job model and lip-sync adapter.
- Corrected hardcoded GPU claims in the LipSync backend and added its capability endpoint.
- Added an Android Text-to-Audio client that calls Nagar Studio.

## Services
- Nagar Studio: http://127.0.0.1:3000
- Local TTS worker: http://127.0.0.1:8080
- CGH Local LipSync: http://127.0.0.1:8000

Environment overrides: GEMINI_API_KEY, NAGAR_LOCAL_WORKER_URL, CGH_LIPSYNC_URL

## Deliberate non-claims
- A GPU is not considered detected merely because the application targets it.
- DirectML is ready only when ONNX Runtime exposes DmlExecutionProvider.
- MuseTalk is not presented as production-ready merely because its Python package imports.
- Reference voices are not represented as owned or officially reproduced without provenance/authorization.

## Next implementation layers
1. Durable desktop project store.
2. Persistent cross-module job queue.
3. Story Studio domain integration through a shared project schema.
4. Wav2Lip as a first-class production action.
5. Verified audio mastering and waveform cache.
6. One-click desktop/local-service packaging.
7. Android project sync, offline queueing and rendered-audio playback.
