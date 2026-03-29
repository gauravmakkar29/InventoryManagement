package com.ims.automation.macros;

import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Waiting;
import com.ims.automation.impls.common.LoginImpl;
import com.ims.automation.pages.common.LoginPage;
import com.ims.automation.pages.dashboard.DashboardPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class Login {

    public static final String ADMIN_EMAIL = "admin@company.com";
    public static final String ADMIN_PASSWORD = "Admin@12345678";
    public static final String TECH_EMAIL = "tech@company.com";
    public static final String TECH_PASSWORD = "Tech@123456789";
    public static final String VIEWER_EMAIL = "viewer@company.com";
    public static final String VIEWER_PASSWORD = "Viewer@12345678";

    public static Performable asAdmin() {
        return withCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    public static Performable asTechnician() {
        return withCredentials(TECH_EMAIL, TECH_PASSWORD);
    }

    public static Performable asViewer() {
        return withCredentials(VIEWER_EMAIL, VIEWER_PASSWORD);
    }

    public static Performable withCredentials(String email, String password) {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(LoginPage.EMAIL_INPUT)),
                LoginImpl.loginWith(email, password),
                (actor) -> actor.is(Waiting.on(DashboardPage.PAGE_HEADING))
        ).log("Login.withCredentials", "Logging in and waiting for dashboard to appear");
    }
}
