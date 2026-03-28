package com.ims.exceptions;


import com.ims.services.NovusLoggerService;

public class NovusUiException extends RuntimeException {

    final NovusLoggerService log = NovusLoggerService.init(NovusUiException.class);

    public NovusUiException(String message) {
        super(message);
        log.uiException(message);
    }
}
