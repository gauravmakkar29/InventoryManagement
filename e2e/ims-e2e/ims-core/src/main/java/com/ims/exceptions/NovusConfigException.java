package com.ims.exceptions;

public class NovusConfigException extends RuntimeException {

    public NovusConfigException(String message) {
        super(message);
    }

    public NovusConfigException(Throwable cause) {
        super(cause);
    }

    public NovusConfigException(String message, Throwable cause) {
        super(message, cause);
    }
}
