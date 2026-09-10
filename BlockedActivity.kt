package com.focusguard.app

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.widget.LinearLayout
import android.widget.TextView
import android.view.Gravity

class BlockedActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER
        root.setPadding(40,40,40,40)

        val title = TextView(this)
        title.text = "🔒 FocusGuard"
        title.textSize = 32f
        title.setTextColor(Color.rgb(23,32,51))

        val msg = TextView(this)
        msg.text = "این برنامه در بازه تمرکز شما محدود شده است.\nبرای ادامه، محدودیت را از پنل FocusGuard لغو کنید."
        msg.textSize = 18f
        msg.gravity = Gravity.CENTER
        msg.setPadding(0,30,0,0)

        root.addView(title)
        root.addView(msg)
        setContentView(root)
    }
}
