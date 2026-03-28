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

    public static Performable withCredentials(String email, String password) {
        return Perform.actions(
                (actor) -> actor.is(Waiting.on(LoginPage.EMAIL_INPUT)),
                LoginImpl.loginWith(email, password),
                (actor) -> actor.is(Waiting.on(DashboardPage.PAGE_HEADING))
        ).log("Login.withCredentials", "Logging in and waiting for dashboard to appear");
    }
}
