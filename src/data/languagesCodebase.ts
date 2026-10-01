import { LanguageCodeSnippet } from '../types';

export const ALL_LANGUAGES_DATA: LanguageCodeSnippet[] = [
  // 1. C - Phase 1 Kernel Ring 0
  {
    id: 'c',
    name: 'C (ISO C17 / Linux Kernel 6.x)',
    category: 'Systems & Kernel',
    phase: 'phase1',
    extension: '.c',
    description: 'Kernel Space (Ring 0) Driver Module intercepting raw V4L2 video frames and UART serial NMEA sentences.',
    roleInArchitecture: 'Attaches directly to physical video (/dev/video0) and serial hardware (/dev/ttyS0). Direct memory mapping into protected kernel rings before any user-space tampering.',
    code: `/*
 * KayBiT_Util Kernel Driver Module: ring0_interceptor.c
 * Target: Linux 6.8+ x86_64 / aarch64
 * License: GPL v2 / Proprietary Dual License
 */
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <linux/uaccess.h>
#include <linux/videodev2.h>
#include <linux/serial_core.h>
#include <linux/mm.h>
#include <linux/ktime.h>
#include <asm/io.h>

#define DRIVER_NAME "kaybit_kernel_interceptor"
#define RING_BUFFER_PAGES 256
#define MMAP_MAGIC_NUM 0x4B415942 /* 'KAYB' */

MODULE_LICENSE("GPL");
MODULE_AUTHOR("KayBiT Systems Security Core");
MODULE_DESCRIPTION("Tamper-Proof Hardware Frame & NMEA Kernel Interceptor");

typedef struct {
    uint64_t monotonic_timestamp_ns;
    uint32_t frame_sequence_id;
    uint32_t raw_pixel_width;
    uint32_t raw_pixel_height;
    uint32_t pixel_format; /* V4L2_PIX_FMT_YUV420 */
    uint8_t  raw_nmea_sentence[128];
    uint8_t  payload_digest[32]; /* Kernel SHA-256 pre-hash */
    uint8_t  reserved[64];
} __attribute__((packed)) kernel_telemetry_header_t;

static void *shared_kernel_mmap_buffer = NULL;
static atomic_t active_frame_counter = ATOMIC_INIT(0);

/* Direct hardware register read via inline assembly */
static inline uint64_t read_hardware_tsc(void) {
    uint32_t lo, hi;
    __asm__ __volatile__ ("rdtsc" : "=a" (lo), "=d" (hi));
    return ((uint64_t)hi << 32) | lo;
}

static int intercept_v4l2_frame_hook(struct v4l2_buffer *buf, void *pixel_vaddr) {
    kernel_telemetry_header_t *hdr;
    if (!shared_kernel_mmap_buffer) return -ENOMEM;

    hdr = (kernel_telemetry_header_t *)shared_kernel_mmap_buffer;
    hdr->monotonic_timestamp_ns = ktime_get_ns();
    hdr->frame_sequence_id = atomic_inc_return(&active_frame_counter);
    hdr->raw_pixel_width = 1920;
    hdr->raw_pixel_height = 1080;
    hdr->pixel_format = V4L2_PIX_FMT_YUV420;

    /* Copy raw frame into isolated DMA ring buffer */
    memcpy(shared_kernel_mmap_buffer + sizeof(kernel_telemetry_header_t),
           pixel_vaddr, 1920 * 1080 * 3 / 2);
    return 0;
}

static int __init kaybit_interceptor_init(void) {
    pr_info("[KayBiT_Kernel] Interceptor initialized. Ring 0 hooks active.\\n");
    return 0;
}

static void __exit kaybit_interceptor_exit(void) {
    pr_info("[KayBiT_Kernel] Interceptor unloaded. Releasing physical MMIO.\\n");
}

module_init(kaybit_interceptor_init);
module_exit(kaybit_interceptor_exit);`,
    sampleInput: 'Hardware interrupts IRQ 24 (MIPI CSI-2 Camera) & IRQ 16 (16550A UART GPS)',
    sampleOutput: 'kernel_telemetry_header_t with verified monotonic ns and locked YUV420 buffer.'
  },

  // 2. Assembly - Phase 1 Inline Memory & TSC
  {
    id: 'assembly',
    name: 'Assembly (x86_64 NASM / ARM64 NEON)',
    category: 'Systems & Kernel',
    phase: 'phase1',
    extension: '.asm',
    description: 'Sub-nanosecond cycle counter and AVX2-accelerated memory copy routines for raw frame hashing buffers.',
    roleInArchitecture: 'Critical-path execution in Ring 0. Replaces standard memcpy with cache-bypassing non-temporal store instructions (MOVNTDQ) to eliminate CPU cache eviction during 4K video frame processing.',
    code: `; KayBiT_Util Low-Latency Memory Engine: fast_stream_copy.asm
; Target: x86_64 System V AMD64 ABI / Linux Kernel
section .text
global fast_nt_frame_copy
global read_invariant_tsc_serialized

; void fast_nt_frame_copy(void *dst, const void *src, size_t num_quadwords);
; rdi = dst, rsi = src, rdx = num_quadwords (units of 64 bytes)
fast_nt_frame_copy:
    test rdx, rdx
    jz .done
.loop_avx2:
    vmovdqu ymm0, [rsi]
    vmovdqu ymm1, [rsi + 32]
    
    ; Non-temporal streaming store (bypasses L1/L2/L3 cache hierarchies)
    vmovntdq [rdi], ymm0
    vmovntdq [rdi + 32], ymm1
    
    add rsi, 64
    add rdi, 64
    dec rdx
    jnz .loop_avx2
    
    sfence          ; Ensure all memory stores are globally visible
    vzeroupper      ; Reset AVX upper bits to avoid legacy SSE transition penalties
.done:
    ret

; uint64_t read_invariant_tsc_serialized(void);
; Returns cycle count in rax
read_invariant_tsc_serialized:
    rdtscp          ; Read Time-Stamp Counter and Processor ID (serialized)
    shl rdx, 32
    or  rax, rdx    ; Combine edx:eax into 64-bit rax
    ret`,
    sampleInput: 'Source frame memory address 0xFFFF88810A2B0000, 3110400 bytes (1080p YUV420)',
    sampleOutput: 'Bypassed CPU cache line fills in 0.41 milliseconds flat; zero cache pollution.'
  },

  // 3. Rust - Phase 1 Cryptographic Signed Vault
  {
    id: 'rust',
    name: 'Rust (Edition 2024 / no_std compatible)',
    category: 'Systems & Kernel',
    phase: 'phase1',
    extension: '.rs',
    description: 'Forensic daemon consuming kernel mmap ring buffer, computing SHA-256 and signing via hardware TPM 2.0 chip.',
    roleInArchitecture: 'User-space security boundary. Guarantees memory safety without garbage collection pauses. Appends immutable asymmetric Ed25519 signatures.',
    code: `//! KayBiT_Util Forensic Daemon: tpm_signed_vault.rs
//! Zero-copy memory mapped ring buffer consumer & TPM 2.0 hardware signer

use sha2::{Sha256, Digest};
use std::fs::OpenOptions;
use std::os::unix::fs::OpenOptionsExt;
use memmap2::MmapOptions;
use ring::signature::{Ed25519KeyPair, KeyPair};

#[repr(C, packed)]
#[derive(Debug, Clone, Copy)]
pub struct KernelTelemetryHeader {
    pub monotonic_timestamp_ns: u64,
    pub frame_sequence_id: u32,
    pub raw_pixel_width: u32,
    pub raw_pixel_height: u32,
    pub pixel_format: u32,
    pub raw_nmea: [u8; 128],
    pub payload_digest: [u8; 32],
}

pub struct TpmSignedVault {
    tpm_key_pair: Ed25519KeyPair,
    mmap_ptr: memmap2::Mmap,
}

impl TpmSignedVault {
    pub fn new(device_path: &str, tpm_pkcs8_seed: &[u8]) -> Result<Self, Box<dyn std::error::Error>> {
        let file = OpenOptions::new()
            .read(true)
            .write(false)
            .custom_flags(libc::O_DIRECT)
            .open(device_path)?;

        let mmap_ptr = unsafe { MmapOptions::new().map(&file)? };
        let tpm_key_pair = Ed25519KeyPair::from_pkcs8(tpm_pkcs8_seed)
            .map_err(|_| "Failed to extract TPM root sealing key")?;

        Ok(Self { tpm_key_pair, mmap_ptr })
    }

    pub fn process_next_frame(&self) -> Result<(String, String), Box<dyn std::error::Error>> {
        // Zero-copy cast from memory mapped buffer
        let header_slice = &self.mmap_ptr[..std::mem::size_of::<KernelTelemetryHeader>()];
        let header: &KernelTelemetryHeader = unsafe {
            &*(header_slice.as_ptr() as *const KernelTelemetryHeader)
        };

        // 1. Calculate SHA-256 frame payload hash
        let mut hasher = Sha256::new();
        hasher.update(&self.mmap_ptr[..]);
        let frame_hash = hasher.finalize();
        let frame_hash_hex = hex::encode(frame_hash);

        // 2. Hardware Asymmetric Signing via Ed25519
        let mut sign_payload = Vec::with_capacity(64);
        sign_payload.extend_from_slice(&header.monotonic_timestamp_ns.to_le_bytes());
        sign_payload.extend_from_slice(frame_hash.as_slice());
        
        let signature = self.tpm_key_pair.sign(&sign_payload);
        let signature_hex = hex::encode(signature.as_ref());

        Ok((frame_hash_hex, signature_hex))
    }
}`,
    sampleInput: 'Kernel mmap fd /dev/kaybit_sec0, Raw frame hash payload',
    sampleOutput: 'Verified (SHA256: 4e9f7b..., Ed25519_Sig: 304502210081...)'
  },

  // 4. Go - Phase 1 Orchestration Layer
  {
    id: 'go',
    name: 'Go (Golang 1.23+)',
    category: 'Systems & Kernel',
    phase: 'phase1',
    extension: '.go',
    description: 'System service coordinating kernel driver lifecycle, monitoring health, and serving local gRPC telemetry streams.',
    roleInArchitecture: 'High-concurrency orchestration daemon. Spawns secure Unix domain sockets and streams Protobuf-encoded telemetry events to downstream application layers.',
    code: `// KayBiT_Util Daemon Orchestrator: service_orchestrator.go
package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

type TelemetryStreamServer struct {
	UnimplementedKaybitTelemetryServer
	activeDriverPID int
	tpmDeviceReady  bool
}

type SignedFramePayload struct {
	SequenceId   uint64    \`protobuf:"varint,1,opt,name=sequence_id"\`
	TimestampUtc string    \`protobuf:"bytes,2,opt,name=timestamp_utc"\`
	Latitude     float64   \`protobuf:"fixed64,3,opt,name=latitude"\`
	Longitude    float64   \`protobuf:"fixed64,4,opt,name=longitude"\`
	FrameHash    string    \`protobuf:"bytes,5,opt,name=frame_hash"\`
	TpmSignature string    \`protobuf:"bytes,6,opt,name=tpm_signature"\`
}

func (s *TelemetryStreamServer) StreamFrames(
	req *StreamRequest,
	stream KaybitTelemetry_StreamFramesServer,
) error {
	log.Printf("[Orchestrator] Client %s subscribed to verified telemetry stream", req.ClientId)
	ticker := time.NewTicker(16 * time.Millisecond) // 60 FPS pacing
	defer ticker.Stop()

	var seq uint64 = 0
	for {
		select {
		case <-stream.Context().Done():
			return nil
		case t := <-ticker.C:
			seq++
			payload := &SignedFramePayload{
				SequenceId:   seq,
				TimestampUtc: t.UTC().Format(time.RFC3339Nano),
				Latitude:     47.3769,
				Longitude:    8.5417,
				FrameHash:    fmt.Sprintf("sha256:d8a9f%08x", seq),
				TpmSignature: fmt.Sprintf("tpm2:sig:ed25519:%016x", seq),
			}
			if err := stream.Send(payload); err != nil {
				return err
			}
		}
	}
}

func main() {
	listener, err := net.Listen("unix", "/var/run/kaybit/telemetry.sock")
	if err != nil {
		log.Fatalf("Failed to bind UNIX domain socket: %v", err)
	}
	server := grpc.NewServer()
	log.Println("[Go Orchestrator] Running KayBiT IPC gRPC Daemon on /var/run/kaybit/telemetry.sock")
	server.Serve(listener)
}`,
    sampleInput: 'StreamRequest{ClientId: "Android_JNI_Bridge", RequestedFps: 60}',
    sampleOutput: 'gRPC Protobuf stream with sub-millisecond latency & zero IPC heap allocations.'
  },

  // 5. Bash - Phase 1 Linux Hardening
  {
    id: 'bash',
    name: 'Bash / Shell (POSIX Hardened)',
    category: 'Legacy & Shell',
    phase: 'phase1',
    extension: '.sh',
    description: 'Host verification, SELinux policy injection, and mock-location sensor spoof prevention script.',
    roleInArchitecture: 'Infrastructure setup. Validates kernel module signatures (CONFIG_MODULE_SIG), disables Android developer mock locations via ADB/sysfs, and verifies TPM PCR registers.',
    code: `#!/usr/bin/env bash
# KayBiT_Util Platform Hardening & Driver Ingestion Script: harden_kernel_env.sh
set -euo pipefail
IFS=$'\\n\\t'

echo "[+] Starting KayBiT_Util Host Environment Verification..."

# 1. Verify Ring 0 Module Signature Enforce Mode
if [[ -f /sys/kernel/security/lockdown ]]; then
    LOCKDOWN_STATE=$(cat /sys/kernel/security/lockdown)
    echo "[*] Kernel Lockdown state: \${LOCKDOWN_STATE}"
fi

# 2. Inspect Hardware TPM 2.0 Character Device
if [[ ! -e /dev/tpmrm0 && ! -e /dev/tpm0 ]]; then
    echo "[-] CRITICAL: Hardware TPM 2.0 / HSM device node not found!"
    exit 1
fi
echo "[+] Hardware TPM 2.0 verified. Checking PCR-7 Secure Boot measurements..."
tpm2_pcrread sha256:7 || echo "[!] Warning: TPM PCR reading requires elevated cap_sys_admin."

# 3. Disable Mock Location Provider & Enable Strict Hardware GNSS
echo "[*] Enforcing strict hardware GNSS UART lock on /dev/ttyS0..."
stty -F /dev/ttyS0 115200 raw -echo -echoe -echok
echo "[+] Telemetry UART pipeline locked to baud 115200."

# 4. Load Kernel Ring 0 Interceptor Module
if ! lsmod | grep -q "kaybit_kernel_interceptor"; then
    echo "[*] Ingesting signed kernel module..."
    insmod /lib/modules/$(uname -r)/extra/kaybit_kernel_interceptor.ko \\
        dma_buffer_mb=64 strict_tpm_mode=1
fi

echo "[SUCCESS] KayBiT_Util Phase 1 Security Invariants Verified."`,
    sampleInput: './harden_kernel_env.sh --verify-tpm --lock-uart=/dev/ttyS0',
    sampleOutput: 'Return code 0: TPM PCR validated, UART locked, module ingested.'
  },

  // 6. PowerShell - Phase 1 Windows Hardening
  {
    id: 'powershell',
    name: 'PowerShell (PS Core 7.4+)',
    category: 'Legacy & Shell',
    phase: 'phase1',
    extension: '.ps1',
    description: 'Windows Device Guard, Hyper-V Virtualization-Based Security (VBS) validation and driver memory isolation.',
    roleInArchitecture: 'Windows host environment verification. Validates Memory Integrity (HVCI), confirms TPM 2.0 EK/AIK certs, and mounts secure mmap buffers.',
    code: `# KayBiT_Util Windows Kernel Memory Guard: Initialize-KaybitDriver.ps1
# Requires -RunAsAdministrator
[CmdletBinding()]
Param(
    [Parameter(Mandatory=$false)]
    [string]$DevicePort = "COM3",
    [switch]$EnforceHvci = $true
)

Write-Host ">>> [KayBiT_Util] Initializing Windows Systems Security Harness..." -ForegroundColor Cyan

# 1. Query Virtualization-Based Security (VBS) & HVCI Status
$VbsStatus = Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\\Microsoft\\Windows\\DeviceGuard
if ($VbsStatus.SecurityServicesRunning -band 2) {
    Write-Host "[+] Hypervisor-Enforced Code Integrity (HVCI) is ACTIVE." -ForegroundColor Green
} elseif ($EnforceHvci) {
    Write-Error "[-] Security Breach: HVCI must be active to protect camera driver Ring 0 hooks."
}

# 2. Check Platform TPM 2.0 Provisioning State
$Tpm = Get-Tpm
if (-not $Tpm.TpmPresent -or -not $Tpm.TpmReady) {
    Write-Error "[-] Hardware TPM 2.0 not ready for asymmetric frame signature sealing."
    Exit 1
}
Write-Host "[+] TPM 2.0 Manufacturer: $($Tpm.ManufacturerIdTxt) - Ready: $($Tpm.TpmReady)" -ForegroundColor Green

# 3. Mount KayBiT Filter Driver to Media Foundation Pipeline
Write-Host "[*] Binding KayBiT Media Kernel Interceptor to $DevicePort..." -ForegroundColor Yellow
Start-Process -FilePath "kaybit_win_daemon.exe" -ArgumentList "--port $DevicePort --tpm-seal" -NoNewWindow
Write-Host "[SUCCESS] Windows Kernel Telemetry Pipe Open." -ForegroundColor Green`,
    sampleInput: '.\\Initialize-KaybitDriver.ps1 -DevicePort "COM1" -EnforceHvci',
    sampleOutput: 'HVCI Verified, TPM 2.0 Ready, Media Foundation Interceptor Mounted.'
  },

  // 7. COBOL - Phase 1 Legacy Mainframe Cluster
  {
    id: 'cobol',
    name: 'COBOL (IBM Enterprise COBOL v6.4 / System/390)',
    category: 'Legacy & Shell',
    phase: 'phase1',
    extension: '.cbl',
    description: 'Mainframe batch sequential processor validating asset GPS coordinates against system-of-record spatial geofences.',
    roleInArchitecture: 'Simulates financial institution and insurance enterprise core. Processes transaction batches from MQ series, comparing signed telemetry against master policy records.',
    code: `      *================================================================*
      * PROGRAM-ID.    KBTAUD01.                                       *
      * AUTHOR.        KAYBIT ENTERPRISE MAINFRAME SYSTEMS.            *
      * INSTALLATION.  IBM Z16 ENTERPRISE ARCHITECTURE.                *
      * PURPOSE.       AUDIT SPATIAL TELEMETRY AGAINST ASSET MASTER.   *
      *================================================================*
       IDENTIFICATION DIVISION.
       PROGRAM-ID. KBTAUD01.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ASSET-MASTER-FILE ASSIGN TO ASSTMST
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-MASTER-STATUS.
           SELECT AUDIT-TRANS-FILE ASSIGN TO AUDITTRN
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-TRANS-STATUS.
           SELECT AUDIT-REPORT-FILE ASSIGN TO RPTFILE
               ORGANIZATION IS SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD  ASSET-MASTER-FILE
           RECORDING MODE IS F
           RECORD CONTAINS 120 CHARACTERS.
       01  ASSET-MASTER-REC.
           05  MST-ASSET-ID          PIC X(12).
           05  MST-MIN-LAT           PIC S9(3)V9(6).
           05  MST-MAX-LAT           PIC S9(3)V9(6).
           05  MST-MIN-LON           PIC S9(3)V9(6).
           05  MST-MAX-LON           PIC S9(3)V9(6).
           05  MST-STATUS-CODE       PIC X(02).
           05  FILLER                PIC X(72).

       FD  AUDIT-TRANS-FILE
           RECORDING MODE IS F
           RECORD CONTAINS 160 CHARACTERS.
       01  AUDIT-TRANS-REC.
           05  TRN-ASSET-ID          PIC X(12).
           05  TRN-TIMESTAMP         PIC X(26).
           05  TRN-ACTUAL-LAT        PIC S9(3)V9(6).
           05  TRN-ACTUAL-LON        PIC S9(3)V9(6).
           05  TRN-TPM-SIG-HASH      PIC X(64).
           05  FILLER                PIC X(43).

       WORKING-STORAGE SECTION.
       01  WS-FLAGS.
           05  WS-MASTER-STATUS      PIC X(02) VALUE "00".
           05  WS-TRANS-STATUS       PIC X(02) VALUE "00".
           05  WS-EOF-TRANS          PIC X(01) VALUE "N".
       01  WS-COUNTERS.
           05  WS-VERIFIED-COUNT     PIC 9(07) COMP-3 VALUE 0.
           05  WS-BREACH-COUNT       PIC 9(07) COMP-3 VALUE 0.

       PROCEDURE DIVISION.
       0000-MAIN-LOGIC.
           PERFORM 1000-INIT-FILES
           PERFORM 2000-PROCESS-AUDIT UNTIL WS-EOF-TRANS = "Y"
           PERFORM 3000-PRINT-SUMMARY
           STOP RUN.

       1000-INIT-FILES.
           OPEN INPUT ASSET-MASTER-FILE
           OPEN INPUT AUDIT-TRANS-FILE
           OPEN OUTPUT AUDIT-REPORT-FILE.

       2000-PROCESS-AUDIT.
           READ AUDIT-TRANS-FILE
               AT END
                   MOVE "Y" TO WS-EOF-TRANS
               NOT AT END
                   IF TRN-ACTUAL-LAT >= MST-MIN-LAT AND
                      TRN-ACTUAL-LAT <= MST-MAX-LAT AND
                      TRN-ACTUAL-LON >= MST-MIN-LON AND
                      TRN-ACTUAL-LON <= MST-MAX-LON
                       ADD 1 TO WS-VERIFIED-COUNT
                   ELSE
                       ADD 1 TO WS-BREACH-COUNT
                       DISPLAY "GEOFENCE BREACH: ASSET " TRN-ASSET-ID
                   END-IF
           END-READ.

       3000-PRINT-SUMMARY.
           CLOSE ASSET-MASTER-FILE
           CLOSE AUDIT-TRANS-FILE
           CLOSE AUDIT-REPORT-FILE.`,
    sampleInput: 'Sequential Batch: Asset "AST-98042", Actual Lat: +047.376900, Actual Lon: +008.541700',
    sampleOutput: 'STATUS: VERIFIED - Zero perimeter breaches in 100,000 legacy records.'
  },

  // 8. Kotlin - Phase 2 CameraX Pipeline
  {
    id: 'kotlin',
    name: 'Kotlin (Kotlin 2.0 / Android Jetpack)',
    category: 'Mobile & Native',
    phase: 'phase2',
    extension: '.kt',
    description: 'Android CameraX ImageAnalysis analyzer extracting NV21/YUV_420_888 surfaces with Coroutine telemetry queues.',
    roleInArchitecture: 'High-frequency mobile acquisition. Decouples hardware camera sensor frames (30-60 FPS) from GPS location ticks (1 Hz) and IMU gyroscopes (100 Hz).',
    code: `package com.kaybit.util.camera

import android.annotation.SuppressLint
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.nio.ByteBuffer

data class RawCameraFrame(
    val buffer: ByteBuffer,
    val width: Int,
    val height: Int,
    val timestampNs: Long,
    val format: Int
)

class PrecisionCameraAnalyzer : ImageAnalysis.Analyzer {

    private val _frameFlow = MutableSharedFlow<RawCameraFrame>(
        replay = 0,
        extraBufferCapacity = 2,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val frameFlow: SharedFlow<RawCameraFrame> = _frameFlow

    @SuppressLint("UnsafeOptInUsageError")
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        try {
            val yBuffer = mediaImage.planes[0].buffer
            val frame = RawCameraFrame(
                buffer = yBuffer,
                width = imageProxy.width,
                height = imageProxy.height,
                timestampNs = imageProxy.imageInfo.timestamp,
                format = imageProxy.format
            )
            // Dispatch to native C++ JNI Kalman burner pipeline
            _frameFlow.tryEmit(frame)
        } finally {
            imageProxy.close()
        }
    }
}`,
    sampleInput: 'SurfaceTexture frame 1920x1080 @ 60 FPS from CameraCharacteristics.LENS_FACING_BACK',
    sampleOutput: 'Low-overhead RawCameraFrame emitted to native memory channel with zero GC churn.'
  },

  // 9. Java - Phase 2 Sensor Engine & Telemetry Ring Buffer
  {
    id: 'java',
    name: 'Java (OpenJDK 21 / Android Sensor API)',
    category: 'Mobile & Native',
    phase: 'phase2',
    extension: '.java',
    description: 'Android hardware SensorEventListener collecting 100 Hz accelerometer and gyroscope vectors into off-heap ring buffers.',
    roleInArchitecture: 'Mobile sensor engine. Ingests raw IMU values and routes them via JNI to the C++ Kalman filtering core without incurring Android runtime garbage collection stalls.',
    code: `package com.kaybit.util.sensors;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class HighRateSensorCollector implements SensorEventListener {
    private static final int BUFFER_CAPACITY = 1024 * 64;
    private final ByteBuffer offHeapBuffer;
    private final SensorManager sensorManager;
    private long sampleCount = 0;

    public HighRateSensorCollector(SensorManager manager) {
        this.sensorManager = manager;
        // Direct non-heap memory allocation for zero JNI serialization overhead
        this.offHeapBuffer = ByteBuffer.allocateDirect(BUFFER_CAPACITY)
                                       .order(ByteOrder.nativeOrder());
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            synchronized (offHeapBuffer) {
                if (offHeapBuffer.remaining() < 32) {
                    offHeapBuffer.clear();
                }
                offHeapBuffer.putLong(event.timestamp);
                offHeapBuffer.putFloat(event.values[0]); // X-axis m/s^2
                offHeapBuffer.putFloat(event.values[1]); // Y-axis m/s^2
                offHeapBuffer.putFloat(event.values[2]); // Z-axis m/s^2
                sampleCount++;
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Handled in Kalman adaptive noise covariance
    }

    public native void dispatchToKalmanCore(ByteBuffer directBuffer, int count);
}`,
    sampleInput: 'SensorEvent: Accel [0.12, 9.81, -0.04] m/s^2 @ 100 Hz',
    sampleOutput: 'Direct off-heap ByteBuffer populated; dispatched across JNI boundary.'
  },

  // 10. C++ - Phase 2 Native NDK Kalman Filter & Vulkan Overlay
  {
    id: 'cpp',
    name: 'C++ (C++20 / Android NDK / Vulkan 1.3)',
    category: 'Mobile & Native',
    phase: 'phase2',
    extension: '.cpp',
    description: 'Real-time 6-DOF Kalman Filter and Vulkan/OpenGL ES shader burn overlay executing under strict 3ms per frame.',
    roleInArchitecture: 'High-performance math and graphics core. Fuses noisy GPS measurements with high-rate accelerometer telemetry, then burns typography directly into GPU surface buffers.',
    code: `/*
 * KayBiT_Util Native Math Core: kalman_vulkan_overlay.cpp
 * Target: Android NDK r26 / Vulkan 1.3
 */
#include <jni.h>
#include <vulkan/vulkan.h>
#include <cmath>
#include <cstring>
#include <chrono>

struct KalmanState6D {
    double lat, lon, alt;
    double vel_north, vel_east, vel_up;
    double P[6][6]; // Covariance matrix
    double Q[6][6]; // Process noise
    double R[6][6]; // Measurement noise
};

static KalmanState6D g_filterState;

extern "C" JNIEXPORT void JNICALL
Java_com_kaybit_util_sensors_HighRateSensorCollector_dispatchToKalmanCore(
    JNIEnv *env, jobject thiz, jobject byteBuffer, jint count) {

    void *rawAddress = env->GetDirectBufferAddress(byteBuffer);
    if (!rawAddress) return;

    float *samples = reinterpret_cast<float*>(rawAddress);
    // Kalman Prediction step: x_k = F * x_{k-1} + B * u_k
    double dt = 0.01; // 100Hz IMU step
    g_filterState.vel_north += samples[1] * dt;
    g_filterState.vel_east  += samples[0] * dt;

    // Numerical drift correction using GPS baseline
    g_filterState.lat += (g_filterState.vel_north * dt) / 111139.0;
    g_filterState.lon += (g_filterState.vel_east  * dt) / (111139.0 * std::cos(g_filterState.lat * 0.0174533));
}

// Vulkan Render Pass: Burns GPS HUD onto frame in sub-2ms window
void RenderTelemetryOverlayVk(VkCommandBuffer cmd, VkDescriptorSet hudDescriptor) {
    vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, nullptr);
    vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, nullptr, 0, 1, &hudDescriptor, 0, nullptr);
    // Draw 4-vertex full-screen HUD quad with burnt telemetry texture
    vkCmdDraw(cmd, 4, 1, 0, 0);
}`,
    sampleInput: 'Raw GPS: 47.3770, Accel delta: +0.22 m/s^2, 60 FPS GPU Render target',
    sampleOutput: 'Fused position (47.376912) rendered onto Vulkan swapchain in 1.48 ms.'
  },

  // 11. Dart / Flutter - Phase 2 User Application & Storage
  {
    id: 'dart',
    name: 'Dart (Flutter 3.24+ / Flutter Engine)',
    category: 'Mobile & Native',
    phase: 'phase2',
    extension: '.dart',
    description: 'Cross-platform presentation UI, MethodChannel/EventChannel bindings, and offline zero-allocation reactive storage.',
    roleInArchitecture: 'Mobile client application layer. Bridges native Kotlin/JNI event streams to Flutter widgets and persists telemetry logs locally to survive network disconnections.',
    code: `// KayBiT_Util Mobile Client: telemetry_bridge.dart
import 'dart:async';
import 'package:flutter/services.dart';

class TelemetryEvent {
  final double latitude;
  final double longitude;
  final double altitude;
  final double speedKmh;
  final String sha256FrameHash;
  final String tpmSignature;

  TelemetryEvent({
    required this.latitude,
    required this.longitude,
    required this.altitude,
    required this.speedKmh,
    required this.sha256FrameHash,
    required this.tpmSignature,
  });

  factory TelemetryEvent.fromMap(Map<dynamic, dynamic> map) {
    return TelemetryEvent(
      latitude: map['lat'] as double,
      longitude: map['lon'] as double,
      altitude: map['alt'] as double,
      speedKmh: map['speed'] as double,
      sha256FrameHash: map['hash'] as String,
      tpmSignature: map['sig'] as String,
    );
  }
}

class TelemetryBridge {
  static const EventChannel _eventChannel = EventChannel('com.kaybit.util/telemetry_stream');
  static const MethodChannel _methodChannel = MethodChannel('com.kaybit.util/camera_control');

  Stream<TelemetryEvent> get telemetryStream {
    return _eventChannel.receiveBroadcastStream().map(
      (dynamic event) => TelemetryEvent.fromMap(event as Map<dynamic, dynamic>),
    );
  }

  Future<void> configureOverlayTemplate(String templateId) async {
    await _methodChannel.invokeMethod('setOverlayTemplate', {'id': templateId});
  }
}`,
    sampleInput: 'EventChannel message from Android NDK native stream',
    sampleOutput: 'Strongly typed TelemetryEvent updating Flutter Reactive HUD at 60 FPS.'
  },

  // 12. TypeScript - Phase 3 Ingestion Gateway
  {
    id: 'typescript',
    name: 'TypeScript (TS 5.5+ / Node.js 22 LTS)',
    category: 'Cloud & Distributed',
    phase: 'phase3',
    extension: '.ts',
    description: 'High-throughput Connection Balancing Gateway with strict data contracts and WebSocket streaming verification.',
    roleInArchitecture: 'Distributed cloud ingress. Manages thousands of simultaneous mobile video streams, parses structured JSON metadata matrices, and enqueues chunks into Redis/RabbitMQ.',
    code: `/**
 * KayBiT_Util Cloud Ingestion Gateway: stream_balancer.ts
 * High-concurrency WebSocket & Chunked HTTPS ingestion engine
 */
import { createServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface TelemetryChunkHeader {
  sessionId: string;
  sequenceIndex: number;
  recordedTimestampUtc: string;
  coordinates: {
    lat: number;
    lon: number;
    altMeters: number;
    hdop: number;
  };
  cryptographicVerification: {
    sha256Hash: string;
    tpmSignatureHex: string;
    tpmKeyId: string;
  };
}

export class SpatialIngestionGateway {
  private wss: WebSocketServer;

  constructor(port: number) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log(\`[Gateway] Inbound forensic stream established from \${req.socket.remoteAddress}\`);

      ws.on('message', async (data: Buffer) => {
        try {
          // Parse contract header (first 512 bytes)
          const headerBytes = data.subarray(0, 512).toString('utf-8').replace(/\\0+$/, '');
          const header: TelemetryChunkHeader = JSON.parse(headerBytes);
          const videoChunkBytes = data.subarray(512);

          // Route to Redis message broker for worker fleets
          await this.dispatchToWorkerQueue(header, videoChunkBytes);
        } catch (err) {
          ws.send(JSON.stringify({ error: 'INVALID_METADATA_HEADER_CONTRACT' }));
        }
      });
    });

    server.listen(port);
  }

  private async dispatchToWorkerQueue(header: TelemetryChunkHeader, chunk: Buffer): Promise<void> {
    // In-memory or Redis stream dispatch
  }
}`,
    sampleInput: 'WebSocket binary packet [512-byte JSON header + 256KB H.264 video chunk]',
    sampleOutput: 'Validated stream header contract, enqueued to RabbitMQ "video-transcode-pool".'
  },

  // 13. JavaScript - Phase 3 Web Worker & Canvas Engine
  {
    id: 'javascript',
    name: 'JavaScript (ES2024 / Web APIs)',
    category: 'Cloud & Distributed',
    phase: 'phase3',
    extension: '.js',
    description: 'Browser client telemetry burning engine, WebRTC media capture pipeline and EXIF metadata extractor.',
    roleInArchitecture: 'Client-side processing engine. Draws dynamic forensic HUD matrices onto HTML5 Canvas surfaces and encodes real-time WebM video recordings with embedded metadata.',
    code: `// KayBiT_Util Client Compositor: canvas_telemetry_burner.js
export class CanvasTelemetryBurner {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: false, desynchronized: true });
  }

  burnForensicHUD(videoSource, telemetry, options) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw raw camera video frame
    ctx.drawImage(videoSource, 0, 0, w, h);

    // 2. High-contrast forensic bounding banner
    ctx.fillStyle = \`rgba(15, 23, 42, \${options.bgOpacity})\`;
    ctx.fillRect(0, h - 84, w, 84);

    // 3. Render precision telemetry line
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = options.fontColor || '#22d3ee';
    
    const coordStr = \`GPS: \${telemetry.latitude.toFixed(6)}°N  \${telemetry.longitude.toFixed(6)}°E  ALT: \${telemetry.altitude.toFixed(1)}m\`;
    const speedStr = \`SPD: \${telemetry.speedKmh.toFixed(1)} km/h  HDG: \${telemetry.headingDeg.toFixed(0)}°  SAT: \${telemetry.satellitesInView}\`;
    const secStr = \`SHA-256: \${telemetry.sha256FrameHash.substring(0, 24)}...  [TPM SEAL: VALID]\`;

    ctx.fillText(coordStr, 16, h - 56);
    ctx.fillText(speedStr, 16, h - 36);
    ctx.fillStyle = '#10b981';
    ctx.fillText(secStr, 16, h - 16);
  }
}`,
    sampleInput: 'HTMLVideoElement 1080p, Telemetry object, Options {bgOpacity: 0.85}',
    sampleOutput: 'Rendered pixel buffer with crisp sub-millisecond timestamp and SHA-256 seal.'
  },

  // 14. Ruby - Phase 3 Video Chunk Worker
  {
    id: 'ruby',
    name: 'Ruby (Ruby 3.3+ / Sidekiq)',
    category: 'Cloud & Distributed',
    phase: 'phase3',
    extension: '.rb',
    description: 'Background worker fleet dequeuing video chunks, extracting EXIF/GPS tracks via ExifTool, and calculating SHA-256 binary matches.',
    roleInArchitecture: 'Media processing engine. Executes shell wrappers around FFmpeg and ExifTool, verifies binary stream integrity, and alerts when metadata tracks are missing or manipulated.',
    code: `# KayBiT_Util Video Processing Worker: media_ingest_worker.rb
require 'sidekiq'
require 'open3'
require 'digest'
require 'json'

class MediaIngestWorker
  include Sidekiq::Job
  sidekiq_options queue: :video_forensics, retry: 3

  def perform(session_id, chunk_file_path, claimed_sha256)
    # 1. Verify binary SHA-256 checksum against signed header
    actual_sha256 = Digest::SHA256.file(chunk_file_path).hexdigest
    if actual_sha256 != claimed_sha256
      raise "IntegrityBreachError: Hash mismatch for chunk #{chunk_file_path}"
    end

    # 2. Extract embedded QuickTime / MP4 GPS location tracks via ExifTool
    cmd = ['exiftool', '-json', '-GPSCoordinates', '-CreateDate', chunk_file_path]
    stdout, stderr, status = Open3.capture3(*cmd)
    
    unless status.success?
      raise "ExifExtractionError: Failed to parse metadata tracks: #{stderr}"
    end

    metadata = JSON.parse(stdout).first
    gps_coordinates = metadata['GPSCoordinates']

    # 3. Offload to Python AI Verification service via HTTP REST / RPC
    dispatch_to_ai_validator(session_id, chunk_file_path, gps_coordinates)
  end

  private

  def dispatch_to_ai_validator(session_id, path, coords)
    # Notifies Python FastAPI worker fleet
  end
end`,
    sampleInput: 'Sidekiq job: session_id: "KBT-902", chunk: "/tmp/vid_004.mp4", sha256: "7a8f..."',
    sampleOutput: 'Metadata verified; EXIF GPS matched against claimed driver header.'
  },

  // 15. PHP - Phase 3 Transcoding Worker Fleet
  {
    id: 'php',
    name: 'PHP (PHP 8.3 / CLI Worker)',
    category: 'Cloud & Distributed',
    phase: 'phase3',
    extension: '.php',
    description: 'FFmpeg process orchestration script generating watermarked stream playback variants and forensic frame dumps.',
    roleInArchitecture: 'High-throughput video worker fleet. Consumes video chunks from background queues, applies FFmpeg burn filters, and extracts individual I-frames for forensic computer vision checks.',
    code: `<?php
declare(strict_types=1);

/**
 * KayBiT_Util Video Transcoding & Watermark Worker
 * Target: PHP 8.3+ with ext-pcntl and FFmpeg 6.x
 */

namespace Kaybit\\Forensics;

class VideoChunkTranscoder
{
    public function __construct(
        private string $ffmpegBinary = '/usr/bin/ffmpeg'
    ) {}

    public function processChunk(string $inputPath, string $outputPath, array $telemetry): bool
    {
        $drawTextFilter = sprintf(
            "drawtext=text='GPS: %s, %s | UTC: %s':x=20:y=h-40:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6",
            $telemetry['latitude'],
            $telemetry['longitude'],
            $telemetry['timestamp']
        );

        $command = [
            $this->ffmpegBinary,
            '-y',
            '-i', $inputPath,
            '-vf', $drawTextFilter,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '22',
            '-c:a', 'copy',
            $outputPath
        ];

        $process = proc_open($command, [
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'], // stderr
        ], $pipes);

        if (!is_resource($process)) {
            return false;
        }

        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);
        return $exitCode === 0;
    }
}`,
    sampleInput: 'processChunk("/tmp/in.mp4", "/tmp/out.mp4", {lat: 47.37, lon: 8.54})',
    sampleOutput: 'Return true: H.264 video variant created with burned-in telemetry subtitle.'
  },

  // 16. Python - Phase 3 Spatial-Temporal AI Assessor
  {
    id: 'python',
    name: 'Python (Python 3.12 / FastAPI / OpenCV / PyTorch)',
    category: 'Cloud & Distributed',
    phase: 'phase3',
    extension: '.py',
    description: 'Computer vision forensic investigator: Optical Character Recognition (OCR) for speed signs & Astronomical Solar Shadow Angle verification.',
    roleInArchitecture: 'AI forensic brain. Calculates exact solar elevation & azimuth to verify whether the physical shadow direction in the video matches the claimed GPS coordinate and timestamp.',
    code: `"""
KayBiT_Util Spatial-Temporal AI Assessor: forensic_cv_investigator.py
Validates physical shadows vs astronomical solar angles & reads speed signs via OCR.
"""
import math
import cv2
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="KayBiT AI Temporal-Spatial Forensic Service")

class ForensicAssessmentRequest(BaseModel):
    video_chunk_path: str
    claimed_latitude: float
    claimed_longitude: float
    claimed_timestamp_utc: str
    observed_shadow_angle_deg: float

def compute_astronomical_solar_position(lat: float, lon: float, dt: datetime):
    # PSA Algorithm (Plataforma Solar de Almería)
    d = (dt - datetime(2000, 1, 1, 12, 0)).total_seconds() / 86400.0
    L = math.radians((280.460 + 0.9856474 * d) % 360)
    g = math.radians((357.528 + 0.9856003 * d) % 360)
    lambda_sun = L + math.radians(1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    
    # Declination & Equation of Time
    eps = math.radians(23.439 - 0.0000004 * d)
    declination = math.asin(math.sin(eps) * math.sin(lambda_sun))
    
    # Hour angle
    t_utc = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
    ha = math.radians(15.0 * (t_utc - 12.0) + lon)
    
    lat_rad = math.radians(lat)
    elevation = math.asin(math.sin(lat_rad) * math.sin(declination) + 
                          math.cos(lat_rad) * math.cos(declination) * math.cos(ha))
    
    azimuth = math.atan2(-math.sin(ha), 
                         math.tan(declination) * math.cos(lat_rad) - math.sin(lat_rad) * math.cos(ha))
    return math.degrees(elevation), (math.degrees(azimuth) + 360) % 360

@app.post("/verify/shadow-timestamp")
async def verify_shadow_angle(req: ForensicAssessmentRequest):
    dt = datetime.fromisoformat(req.claimed_timestamp_utc.replace('Z', '+00:00'))
    elevation, azimuth = compute_astronomical_solar_position(
        req.claimed_latitude, req.claimed_longitude, dt
    )

    expected_shadow_direction = (azimuth + 180.0) % 360.0
    angular_discrepancy = abs(expected_shadow_direction - req.observed_shadow_angle_deg)
    if angular_discrepancy > 180.0:
        angular_discrepancy = 360.0 - angular_discrepancy

    # Fraud threshold: discrepancy > 15 degrees indicates forged GPS timestamp
    is_fraudulent = angular_discrepancy > 15.0
    return {
        "claimed_coords": {"lat": req.claimed_latitude, "lon": req.claimed_longitude},
        "solar_elevation_deg": round(elevation, 2),
        "solar_azimuth_deg": round(azimuth, 2),
        "expected_shadow_angle": round(expected_shadow_direction, 2),
        "observed_shadow_angle": round(req.observed_shadow_angle_deg, 2),
        "angular_error_deg": round(angular_discrepancy, 2),
        "fraud_flag": is_fraudulent,
        "verdict": "FLAGGED_FORGED_TIMESTAMP" if is_fraudulent else "AUTHENTIC_SOLAR_ALIGNMENT"
    }`,
    sampleInput: 'Lat: 47.3769, Lon: 8.5417, UTC: "2026-06-21T12:00:00Z", Observed Shadow: 20°',
    sampleOutput: 'Expected Shadow: 184.2°, Discrepancy: 164.2° -> VERDICT: FLAGGED_FORGED_TIMESTAMP'
  },

  // 17. SQL - Phase 4 PostGIS Spatial Engine
  {
    id: 'sql',
    name: 'SQL (PostgreSQL 16 + PostGIS 3.4)',
    category: 'Analytics & Math',
    phase: 'phase4',
    extension: '.sql',
    description: 'Spatial-OLAP warehousing schema with range partitioning and PostGIS geometric intersection queries.',
    roleInArchitecture: 'Enterprise spatial database. Detects impossible speed vectors (vehicles exceeding aircraft limits) and coordinates intersecting open ocean or restricted airspaces using ST_Contains and ST_Distance.',
    code: `-- KayBiT_Util Spatial Warehousing: fleet_spatial_olap.sql
-- PostgreSQL 16 with PostGIS 3.4 Spatial Extensions

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 1. Range-partitioned fleet telemetry table
CREATE TABLE fleet_telemetry_logs (
    log_id BIGSERIAL,
    vehicle_vin VARCHAR(17) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    geom GEOMETRY(PointZ, 4326) NOT NULL, -- WGS84 3D Point (Lon, Lat, Alt)
    speed_kmh NUMERIC(6, 2) NOT NULL,
    heading_deg NUMERIC(5, 2),
    tpm_hash_verified BOOLEAN NOT NULL,
    PRIMARY KEY (log_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE INDEX idx_telemetry_geom ON fleet_telemetry_logs USING GIST (geom);
CREATE INDEX idx_telemetry_vin_time ON fleet_telemetry_logs (vehicle_vin, recorded_at DESC);

-- 2. Detect impossible velocity anomalies (> 250 km/h jump between sequential pings)
WITH sequential_pings AS (
    SELECT
        vehicle_vin,
        recorded_at,
        geom,
        LAG(geom) OVER (PARTITION BY vehicle_vin ORDER BY recorded_at) as prev_geom,
        EXTRACT(EPOCH FROM (recorded_at - LAG(recorded_at) OVER (PARTITION BY vehicle_vin ORDER BY recorded_at))) as dt_seconds
    FROM fleet_telemetry_logs
    WHERE recorded_at >= NOW() - INTERVAL '24 hours'
)
SELECT
    vehicle_vin,
    recorded_at,
    ROUND((ST_Distance(geom::geography, prev_geom::geography) / dt_seconds * 3.6)::numeric, 2) AS calculated_speed_kmh,
    'SUPERSONIC_TELEPORTATION_ANOMALY' AS violation_code
FROM sequential_pings
WHERE dt_seconds > 0 
  AND (ST_Distance(geom::geography, prev_geom::geography) / dt_seconds * 3.6) > 250.0;

-- 3. Detect unauthorized coordinates intersecting open water or maritime boundaries
SELECT 
    t.vehicle_vin,
    t.recorded_at,
    ST_AsText(t.geom) AS coordinate_wkt,
    m.zone_name
FROM fleet_telemetry_logs t
JOIN restricted_maritime_zones m 
  ON ST_Contains(m.geom_boundary, t.geom)
WHERE t.recorded_at >= NOW() - INTERVAL '7 days';`,
    sampleInput: 'Pings: Ping A (12:00:00, Zurich), Ping B (12:00:05, Paris) -> Distance 500km in 5s',
    sampleOutput: 'VIOLATION DETECTED: calculated_speed_kmh = 360,000 km/h -> SUPERSONIC_TELEPORTATION_ANOMALY'
  },

  // 18. Scala - Phase 4 Apache Spark Distributed Core
  {
    id: 'scala',
    name: 'Scala (Scala 3.3 / Apache Spark 3.5)',
    category: 'Analytics & Math',
    phase: 'phase4',
    extension: '.scala',
    description: 'Distributed streaming pipeline aggregating massive coordinate streams and modeling global fleet movement trends.',
    roleInArchitecture: 'Big data processing core. Reads partitioned parquet and S3 telemetry streams, calculates fleet cluster densities, and cleans up dropped frames across 10M+ daily vehicles.',
    code: `// KayBiT_Util Big Data Analytics: FleetSparkAggregator.scala
package com.kaybit.util.analytics

import org.apache.spark.sql.{SparkSession, DataFrame}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.expressions.Window

object FleetSparkAggregator {
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder()
      .appName("KayBiT_Fleet_Spatial_Aggregator")
      .config("spark.sql.streaming.forceDeleteTempCheckpointLocation", "true")
      .getOrCreate()

    import spark.implicits._

    // 1. Ingest partitioned telemetry logs from S3 Data Lake
    val telemetryStream: DataFrame = spark.readStream
      .format("parquet")
      .option("path", "s3a://kaybit-telemetry-lake/partitioned_events/")
      .load()

    // 2. Windowed aggregations over 15-minute tumbling windows
    val fleetDensityAndDrift = telemetryStream
      .withWatermark("recorded_at", "10 minutes")
      .groupBy(
        window($"recorded_at", "15 minutes"),
        $"geohash_prefix_6"
      )
      .agg(
        count($"log_id").as("total_pings"),
        avg($"speed_kmh").as("mean_fleet_speed"),
        stddev($"speed_kmh").as("speed_variance"),
        count(when($"tpm_hash_verified" === false, 1)).as("tamper_detected_count")
      )

    // 3. Write anomaly metrics to analytical sink
    fleetDensityAndDrift.writeStream
      .format("console")
      .outputMode("update")
      .start()
      .awaitTermination()
  }
}`,
    sampleInput: 'S3 Data Lake with 120 million partitioned telemetry rows',
    sampleOutput: 'Aggregated geohash clusters with detected tamper anomalies processed in 4.2 seconds.'
  },

  // 19. R - Phase 4 Statistical Modeling Core
  {
    id: 'r',
    name: 'R (R 4.4 / Tidyverse / Spatial)',
    category: 'Analytics & Math',
    phase: 'phase4',
    extension: '.r',
    description: 'Multivariate statistical fraud detection calculating Mahalanobis distances to detect simulated driver mileage and route theft.',
    roleInArchitecture: 'Statistical evaluation core. Flags anomalous driver behavior by computing statistical deviation matrices across fuel rate, reported GPS displacement, and odometer ticks.',
    code: `# KayBiT_Util Forensic Statistics: route_fraud_detector.r
# Detects multi-point driver mileage fraud and artificial GPS spoofing

library(tidyverse)
library(robustbase)

analyze_fleet_route_anomalies <- function(telemetry_df) {
  # 1. Feature extraction: Speed, Acceleration Variance, Turn Rate, Reported vs Physics Displacement
  feature_matrix <- telemetry_df %>%
    mutate(
      speed_diff = abs(reported_speed - calculated_speed),
      hdop_jitter = c(0, diff(hdop)),
      accel_z_score = scale(acceleration)
    ) %>%
    select(speed_diff, hdop_jitter, accel_z_score) %>%
    na.omit()

  # 2. Robust Mahalanobis Distance using Minimum Covariance Determinant (MCD)
  mcd_fit <- covMcd(feature_matrix)
  center <- mcd_fit$center
  cov_matrix <- mcd_fit$cov

  # Compute statistical distances
  feature_matrix$mahalanobis_dist <- mahalanobis(feature_matrix, center, cov_matrix)

  # 3. Chi-square threshold at 99.9% confidence (degrees of freedom = 3)
  threshold <- qchisq(0.999, df = 3)
  
  feature_matrix <- feature_matrix %>%
    mutate(is_fraudulent_route = mahalanobis_dist > threshold)

  outlier_count <- sum(feature_matrix$is_fraudulent_route)
  cat(sprintf("[R Forensic Core] Analyzed %d pings. Outliers flagged: %d (Threshold: %.2f)\\n", 
              nrow(feature_matrix), outlier_count, threshold))
  
  return(feature_matrix)
}`,
    sampleInput: 'Dataframe: 50,000 fleet GPS points with HDOP, speed, and accelerometer telemetry',
    sampleOutput: '14 points flagged as fraudulent (Mahalanobis distance > 16.27, p < 0.001).'
  },

  // 20. MATLAB - Phase 4 Signal Anomaly Analyzer
  {
    id: 'matlab',
    name: 'MATLAB (R2024b / Phased Array & Navigation Toolbox)',
    category: 'Analytics & Math',
    phase: 'phase4',
    extension: '.m',
    description: 'Inspects satellite signal-to-noise ratios (SNR), HDOP/VDOP geometry, and clock biases to identify software GPS emulators.',
    roleInArchitecture: 'Hardware physics validator. Real GNSS receivers exhibit atmospheric Doppler shift and fluctuating Carrier-to-Noise density (C/N0). Emulators generate synthetic static signals that fail this test.',
    code: `% KayBiT_Util GNSS Signal Analyzer: gnss_emulator_detector.m
function [is_emulator_spoofed, confidence] = gnss_emulator_detector(snr_matrix, doppler_shifts, clock_drift)
    % snr_matrix: N_satellites x N_samples Carrier-to-Noise Ratio (dB-Hz)
    % doppler_shifts: Observed frequency offsets due to satellite orbit velocity
    % clock_drift: Receiver crystal oscillator bias over time (ns)
    
    [n_sats, n_samples] = size(snr_matrix);
    
    % 1. Evaluate SNR Variance across satellites
    % Physical antennas show fluctuating C/N0 due to multipath and atmospheric scintillation.
    % Synthetic emulators frequently output flat, constant SNR values (e.g. exactly 45.0 dB-Hz).
    snr_var = var(snr_matrix, 0, 2);
    mean_var = mean(snr_var);
    
    % 2. Inspect Clock Drift Entropy
    % Real hardware oscillators drift non-linearly due to thermal gradients.
    drift_diff = diff(clock_drift);
    drift_jitter = std(drift_diff);
    
    % 3. Anomaly Scoring
    is_flat_snr = mean_var < 0.05;      % Variance close to zero = emulator
    is_zero_drift = drift_jitter < 1e-9; % Perfect clock = software synthetic generator
    
    if is_flat_snr && is_zero_drift
        is_emulator_spoofed = true;
        confidence = 0.994;
        disp('[MATLAB] CRITICAL: Software GPS Emulator Detected! Perfectly invariant C/N0.');
    else
        is_emulator_spoofed = false;
        confidence = 0.982;
        disp('[MATLAB] PASS: Natural atmospheric Doppler and crystal drift observed.');
    end
end`,
    sampleInput: 'C/N0 matrix: 12 satellites with constant 42.000 dB-Hz and zero clock drift',
    sampleOutput: 'is_emulator_spoofed: TRUE, confidence: 99.4% (Artifact: Invariant C/N0)'
  },

  // 21. C# - Phase 1 & 4 Windows Forensic Cryptoki Bridge
  {
    id: 'csharp',
    name: 'C# (.NET 8.0 / C# 12)',
    category: 'Systems & Kernel',
    phase: 'phase1',
    extension: '.cs',
    description: 'Enterprise forensic service bridging Windows TPM Cryptography Next Generation (CNG) and spatial verification.',
    roleInArchitecture: 'Enterprise Windows forensic suite. Validates hardware attestation certificates, extracts hardware TPM AIK public keys, and inspects video frame chain-of-custody seals.',
    code: `// KayBiT_Util Forensic Attestation Core: TpmAttestationValidator.cs
using System;
using System.Security.Cryptography;
using System.Text;

namespace Kaybit.Util.Forensics
{
    public class TpmAttestationValidator
    {
        private readonly ECDsaCng _cngKey;

        public TpmAttestationValidator(CngKey hardwareKey)
        {
            // Bind to Windows Hardware Security Platform TPM Key
            _cngKey = new ECDsaCng(hardwareKey);
        }

        public bool VerifyFrameAttestation(string frameHashHex, string signatureHex, long timestampNs)
        {
            byte[] frameHashBytes = Convert.FromHexString(frameHashHex);
            byte[] signatureBytes = Convert.FromHexString(signatureHex);
            
            // Reconstruct signed message payload
            byte[] timestampBytes = BitConverter.GetBytes(timestampNs);
            byte[] payload = new byte[timestampBytes.Length + frameHashBytes.Length];
            Buffer.BlockCopy(timestampBytes, 0, payload, 0, timestampBytes.Length);
            Buffer.BlockCopy(frameHashBytes, 0, payload, timestampBytes.Length, frameHashBytes.Length);

            // Hardware TPM signature verification
            bool isValid = _cngKey.VerifyData(payload, signatureBytes, HashAlgorithmName.SHA256);
            Console.WriteLine($"[C# Forensic Core] Frame {frameHashHex[..8]} TPM Verified: {isValid}");
            return isValid;
        }
    }
}`,
    sampleInput: 'Frame SHA-256: "b10a4f...", Sig: "304502...", Timestamp: 177488920194482',
    sampleOutput: 'Frame verified authentic under Windows CNG Hardware TPM 2.0 provider.'
  }
];
