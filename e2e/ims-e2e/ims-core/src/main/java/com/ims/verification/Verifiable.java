package com.ims.verification;

import com.ims.actor.Actor;

public interface Verifiable {

    void verifyAs(Actor actor);

    Verifiable byWaitingFor(double seconds);
}
