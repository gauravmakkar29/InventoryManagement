package com.ims.automation.pages.common;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class LoginPage {
    public static final String PAGE_TITLE = LocateBy.css("h2");
    public static final String EMAIL_INPUT = LocateBy.css("input#signin-email");
    public static final String PASSWORD_INPUT = LocateBy.css("input#signin-password");
    public static final String SIGN_IN_BUTTON = LocateBy.css("button[type='submit']");
    public static final String ERROR_MESSAGE = LocateBy.css("[role='alert']");
    public static final String DEMO_CREDENTIALS = LocateBy.css(".rounded-lg.bg-gray-50");
}
