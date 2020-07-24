package wooyun.webview

import android.annotation.SuppressLint
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

class MainActivity : AppCompatActivity() {
    private var mWebView: WebView? = null
    private var mExitTime = 0L
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        supportActionBar!!.hide()
        initAndSetupView()
    }

    @SuppressLint("WrongViewCast")
    fun initAndSetupView() {
        val webViewContainer = findViewById(R.id.web) as FrameLayout
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        mWebView = WebView(applicationContext)
        webViewContainer.addView(mWebView, params)
        var webSettings = mWebView!!.settings
        webSettings.javaScriptEnabled = true
        webSettings.javaScriptCanOpenWindowsAutomatically = true
        webSettings.allowFileAccess = true
        webSettings.setSupportZoom(true)
        webSettings.javaScriptCanOpenWindowsAutomatically = true
        webSettings.cacheMode = WebSettings.LOAD_NO_CACHE
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        mWebView!!.setOnKeyListener(OnKeyEvent)
        mWebView!!.setWebViewClient(webClient)
        mWebView!!.loadUrl("file:///android_asset/index.html")
    }

    private val OnKeyEvent = View.OnKeyListener { v, keyCode, event ->
        val action = event.action
        val webView = v as WebView
        if (KeyEvent.ACTION_DOWN == action && KeyEvent.KEYCODE_BACK == keyCode) {
            if (webView?.canGoBack()) {
                webView.goBack()
                return@OnKeyListener true
            }
        }
        false
    }
    private val webClient = object : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            print(url)
            return false
        }
    }
}