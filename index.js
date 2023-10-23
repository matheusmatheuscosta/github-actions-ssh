#!/usr/bin/env node
const axios = require('axios');
const core = require('@actions/core');
console.log("amqp created.");
try {
  const PASSWORD_VAULT_URL = core.getInput("PASSWORD_VAULT_URL");
  let HOST = core.getInput("HOST");
  let PORT = core.getInput("PORT");
  if (PORT == null || PORT == "") {
    PORT = 22;
  }
  let USERNAME = core.getInput("USERNAME");
  let PASSWORD = core.getInput("PASSWORD");
  let SCRIPT = core.getInput("SCRIPT");
  if (PASSWORD_VAULT_URL) {
    const url = PASSWORD_VAULT_URL + '/secrets/replace';
    const data = {
      HOST: HOST,
      PORT: PORT,
      USERNAME: USERNAME,
      PASSWORD: PASSWORD,
      SCRIPT: SCRIPT
    }
    let retorno = null;
    axios.post(url, data).then(function (response) {
      retorno = response.data;
      HOST = retorno.HOST;
      PORT = retorno.PORT;
      USERNAME = retorno.USERNAME;
      PASSWORD = retorno.PASSWORD;
      SCRIPT = retorno.SCRIPT;
      sendSsh(HOST, USERNAME, PASSWORD, SCRIPT);
    }).catch(function (error) {
      console.log(error);
    });
  } else {
    console.log("PASSWORD_VAULT_URL is empty");
    sendSsh(HOST, USERNAME, PASSWORD, SCRIPT);
  }
} catch (error) {
  core.setFailed(error.message);
}

// cria função para executar o script via ssh linha por linha
function sendSsh(HOST, USERNAME, PASSWORD, SCRIPT) {
  const Client = require('ssh2').Client;
  const conn = new Client();
  conn.on('ready', function () {
    console.log('Client :: ready');
    conn.exec(SCRIPT, function (err, stream) {
      if (err) throw err;
      stream.on('close', function (code, signal) {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        conn.end();
      }).on('data', function (data) {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', function (data) {
        console.log('STDERR: ' + data);
      });
    });
  }).connect({
    host: HOST,
    port: PORT,
    username: USERNAME,
    password: PASSWORD
  });
}