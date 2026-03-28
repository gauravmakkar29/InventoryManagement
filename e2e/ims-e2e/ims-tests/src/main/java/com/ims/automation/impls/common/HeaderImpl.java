package com.ims.automation.impls.common;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.automation.pages.common.HeaderPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HeaderImpl {

    public static Performable clickSearch() {
        return Perform.actions(
                Click.on(HeaderPage.SEARCH_BUTTON)
        ).log("clickSearch", "Clicking search button in header");
    }

    public static Performable clickNotificationBell() {
        return Perform.actions(
                Click.on(HeaderPage.NOTIFICATION_BELL)
        ).log("clickNotificationBell", "Clicking notification bell in header");
    }

    public static Performable toggleTheme() {
        return Perform.actions(
                Click.on(HeaderPage.THEME_TOGGLE)
        ).log("toggleTheme", "Toggling theme via header button");
    }

    public static Performable clickSignOut() {
        return Perform.actions(
                Click.on(HeaderPage.USER_INFO),
                Click.on(HeaderPage.SIGN_OUT_BUTTON)
        ).log("clickSignOut", "Signing out via header user menu");
    }
}
