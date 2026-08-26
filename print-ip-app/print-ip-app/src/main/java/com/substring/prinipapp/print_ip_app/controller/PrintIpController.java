package com.substring.prinipapp.print_ip_app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.UnknownHostException;

@RestController
@RequestMapping("/")
public class PrintIpController {
    @GetMapping
    public ResponseEntity<ServerDetail> getServerDetail() throws UnknownHostException {
        InetAddress localHost = InetAddress.getLocalHost();
        System.out.println("Local host: " + localHost.getHostAddress());
        ServerDetail serverDetail = new ServerDetail(localHost.getHostAddress(), localHost.getHostName(),"UP");
        return ResponseEntity.ok(serverDetail);
    }
}

record  ServerDetail(
        String serverAddress,
        String  hostName,
        String status
){

}
