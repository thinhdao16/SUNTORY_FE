# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Giữ các class của WebView và IME
-keep class android.webkit.** { *; }
-dontwarn android.webkit.**

-keep class android.view.inputmethod.** { *; }
-dontwarn android.view.inputmethod.**

# Giữ Capacitor bridge
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Giữ hàm JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Giữ androidx.webkit (WebViewCompat, etc.)
-keep class androidx.webkit.** { *; }
-dontwarn androidx.webkit.**

