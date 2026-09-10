package com.focusguard.app

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.Intent
import android.os.SystemClock

class FocusAccessibilityService : AccessibilityService() {

    // Demo enforcement:
    // When Instagram becomes the foreground package, this service opens a local
    // blocked screen. Production should fetch signed restriction policies from
    // the FocusGuard API and validate the current time server-side.
    private val blockedPackages = setOf("com.instagram.android")

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val pkg = event?.packageName?.toString() ?: return
        if (pkg in blockedPackages) {
            val intent = Intent(this, BlockedActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            startActivity(intent)
        }
    }

    override fun onInterrupt() {}
}
