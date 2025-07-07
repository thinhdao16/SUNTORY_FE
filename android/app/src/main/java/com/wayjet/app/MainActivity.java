package com.wayjet.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth; // <-- thêm dòng này

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Đăng ký plugin GoogleAuth (QUAN TRỌNG)
    registerPlugin(GoogleAuth.class);

    // Tuỳ chọn: xử lý bàn phím đẩy view lên
    getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
  }
}
