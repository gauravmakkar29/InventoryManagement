package com.ims.automation.impls.common;

import com.ims.actions.Click;
import com.ims.actions.Perform;
import com.ims.actions.Performable;
import com.ims.actions.Type;
import com.ims.actions.Waiting;
import com.ims.automation.pages.common.LoginPage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class LoginImpl {

    public static Performable enterEmail(String email) {
        return Perform.actions(
                Type.text(email).on(LoginPage.EMAIL_INPUT)
        ).log("enterEmail", "Entering email address into login form");
    }

    public static Performable enterPassword(String password) {
        return Perform.actions(
                Type.text(password).on(LoginPage.PASSWORD_INPUT)
        ).log("enterPassword", "Entering password into login form");
    }

    public static Performable clickSignIn() {
        return Perform.actions(
                Click.on(LoginPage.SIGN_IN_BUTTON)
        ).log("clickSignIn", "Clicking the Sign In button");
    }

    public static Performable loginWith(String email, String password) {
        return Perform.actions(
                Type.text(email).on(LoginPage.EMAIL_INPUT),
                Type.text(password).on(LoginPage.PASSWORD_INPUT),
                Click.on(LoginPage.SIGN_IN_BUTTON)
        ).log("loginWith", "Logging in with provided credentials");
    }
}
