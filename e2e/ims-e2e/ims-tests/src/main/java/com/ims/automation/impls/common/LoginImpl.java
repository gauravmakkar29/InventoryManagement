package com.ims.automation.impls.common;

import com.ims.actions.Click;
import com.ims.actions.Enter;
import com.ims.actions.Keyboard;
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

    public static Performable fillEmail(String email) {
        return Perform.actions(
                Enter.text(email).on(LoginPage.EMAIL_INPUT)
        ).log("fillEmail", "Filling email address instantly");
    }

    public static Performable fillPassword(String password) {
        return Perform.actions(
                Enter.text(password).on(LoginPage.PASSWORD_INPUT)
        ).log("fillPassword", "Filling password instantly");
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

    public static Performable focusPasswordField() {
        return Perform.actions(
                Click.on(LoginPage.PASSWORD_INPUT)
        ).log("focusPasswordField", "Focusing on password input to trigger policy hints");
    }

    public static Performable clickShowPassword() {
        return Perform.actions(
                Click.on(LoginPage.SHOW_PASSWORD_BUTTON)
        ).log("clickShowPassword", "Clicking show password toggle");
    }

    public static Performable clickHidePassword() {
        return Perform.actions(
                Click.on(LoginPage.HIDE_PASSWORD_BUTTON)
        ).log("clickHidePassword", "Clicking hide password toggle");
    }

    public static Performable clickForgotPassword() {
        return Perform.actions(
                Click.on(LoginPage.FORGOT_PASSWORD_BUTTON)
        ).log("clickForgotPassword", "Clicking forgot password button");
    }

    public static Performable tabOutOfEmail() {
        return Perform.actions(
                Keyboard.press("Tab").on(LoginPage.EMAIL_INPUT)
        ).log("tabOutOfEmail", "Pressing Tab to blur email field");
    }
}
