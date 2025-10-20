package com.wayjet.app;

import android.os.Bundle;
import android.view.WindowManager;                    
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth; 
public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    registerPlugin(GoogleAuth.class);

    getWindow().setSoftInputMode(
      WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
      | WindowManager.LayoutParams.SOFT_INPUT_STATE_UNCHANGED
    );
  }
}
