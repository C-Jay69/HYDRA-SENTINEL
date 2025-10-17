package com.childmonitorapp.stealth;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

public class StealthModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;

    public StealthModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "StealthModule";
    }

    @ReactMethod
    public void hideAppIcon(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                PackageManager p = activity.getPackageManager();
                ComponentName componentName = new ComponentName(activity, com.childmonitorapp.MainActivity.class);
                p.setComponentEnabledSetting(componentName, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                promise.resolve("App icon hidden");
            }
        } catch (Exception e) {
            promise.reject("ERR_ICON_HIDE", e.getMessage());
        }
    }

    @ReactMethod
    public void showAppIcon(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                PackageManager p = activity.getPackageManager();
                ComponentName componentName = new ComponentName(activity, com.childmonitorapp.MainActivity.class);
                p.setComponentEnabledSetting(componentName, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                promise.resolve("App icon shown");
            }
        } catch (Exception e) {
            promise.reject("ERR_ICON_SHOW", e.getMessage());
        }
    }

    @ReactMethod
    public void isDeviceAdmin(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                DevicePolicyManager dpm = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);
                ComponentName deviceAdmin = new ComponentName(activity, DeviceAdmin.class);
                promise.resolve(dpm.isAdminActive(deviceAdmin));
            }
        } catch (Exception e) {
            promise.reject("ERR_DEVICE_ADMIN_CHECK", e.getMessage());
        }
    }

    @ReactMethod
    public void requestDeviceAdmin(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                ComponentName deviceAdmin = new ComponentName(activity, DeviceAdmin.class);
                Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
                intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdmin);
                intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Parental Control app needs device admin privileges to prevent uninstallation.");
                activity.startActivity(intent);
                promise.resolve("Request sent");
            }
        } catch (Exception e) {
            promise.reject("ERR_DEVICE_ADMIN_REQUEST", e.getMessage());
        }
    }
    
    @ReactMethod
    public void disguiseApp(String newName, String newIcon, Promise promise) {
        // This is a placeholder. Changing app alias would be more complex.
        promise.resolve("Disguise not implemented");
    }

    @ReactMethod
    public void runAsSystemService(Promise promise) {
        // This requires root or system-level permissions
        promise.resolve("System service not implemented");
    }

    @ReactMethod
    public void checkAppIntegrity(Promise promise) {
        // This is a placeholder. Would require checksum verification of app files.
        promise.resolve(true);
    }

    @ReactMethod
    public void checkUninstallAttempt(Promise promise) {
        // Placeholder. Could be implemented by monitoring settings activity.
        promise.resolve(false);
    }

    @ReactMethod
    public void emergencyLockdown(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                DevicePolicyManager dpm = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);
                dpm.lockNow();
                promise.resolve("Device locked");
            }
        } catch (Exception e) {
            promise.reject("ERR_LOCKDOWN", e.getMessage());
        }
    }

}
