package com.ims.actor;

import com.microsoft.playwright.Page;
import com.ims.actions.Performable;
import com.ims.actions.Waiter;
import com.ims.utils.AppContextManager;
import com.ims.verification.NovusSoftAssert;
import com.ims.verification.Verifiable;

import java.util.Arrays;
import java.util.Objects;

import static com.ims.actions.Waiter.waitingForSeconds;

public class Actor {

    private Page page;

    public Page usesBrowser() {
        if (Objects.isNull(page)) {
            return (Page) AppContextManager.getAppContext().getBean("getDriver");
        }
        return page;
    }

    public void setBrowser(Page... page) {
        this.page = page[0];
    }

    public void attemptsTo(Performable... tasks) {
        Arrays.stream(tasks).filter(Objects::nonNull).forEachOrdered(t -> t.performAs(this));
    }

    public NovusSoftAssert wantsTo(NovusSoftAssert assertions) {
        return assertions;
    }

    public void wantsTo(Verifiable verify) {
        verify.verifyAs(this);
    }

    public void isWaitingFor(double seconds) {
        waitingForSeconds(seconds);
    }

    public boolean is(Waiter waiter) {
        return waiter.waitAs(this);
    }

    public boolean is(Waiter... waiting) {
        var yesNo = false;
        for (Waiter wait : waiting) {
            yesNo = wait.waitAs(this);
        }
        return yesNo;
    }

}
