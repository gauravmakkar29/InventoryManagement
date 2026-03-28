package com.ims.automation.services;

import com.ims.services.BaseUrlService;
import org.springframework.stereotype.Service;

@Service
public class UrlService extends BaseUrlService {

    @Override
    public String baseUrl() {
        return protocol + domain;
    }

    public String dashboard() {
        return baseUrl() + "/dashboard";
    }

    public String inventory() {
        return baseUrl() + "/inventory";
    }

    public String deployment() {
        return baseUrl() + "/deployment";
    }

    public String compliance() {
        return baseUrl() + "/compliance";
    }

    public String accountService() {
        return baseUrl() + "/account-service";
    }

    public String analytics() {
        return baseUrl() + "/analytics";
    }

    public String login() {
        return baseUrl() + "/login";
    }
}
