package com.ims.browser;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;
import com.ims.annotations.Prototype;

@Prototype
public class PageOptions {

    public Page.NavigateOptions getDefaultSetupOptions() {
        return new Page.NavigateOptions().setWaitUntil(WaitUntilState.DOMCONTENTLOADED).setWaitUntil(WaitUntilState.LOAD).setTimeout(40000);
    }
}
