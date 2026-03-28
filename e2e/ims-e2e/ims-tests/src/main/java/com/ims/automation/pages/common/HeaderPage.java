package com.ims.automation.pages.common;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HeaderPage {
    public static final String HEADER_BAR = LocateBy.css("header");
    public static final String SEARCH_BUTTON = LocateBy.css("[data-testid='header-search']");
    public static final String NOTIFICATION_BELL = LocateBy.css("[data-testid='notification-bell']");
    public static final String THEME_TOGGLE = LocateBy.css("[data-testid='theme-toggle']");
    public static final String USER_INFO = LocateBy.css("[data-testid='user-info']");
    public static final String SIGN_OUT_BUTTON = LocateBy.css("[data-testid='sign-out']");
}
