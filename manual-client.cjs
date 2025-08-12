const https = require("https");

function callClaude(message) {
  const data = JSON.stringify({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 50,
    messages: [{role: "user", content: message}]
  });

  const options = {
    hostname: "api.anthropic.com",
    port: 443,
    path: "/v1/messages",
    method: "POST",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length": data.length
    }
  };

  console.log("Fazendo requisição manual...");
  
  const req = https.request(options, (res) => {
    console.log("Status:", res.statusCode);
    let responseData = "";
    res.on("data", (chunk) => responseData += chunk);
    res.on("end", () => {
      try {
        const result = JSON.parse(responseData);
        console.log("Manual client funcionou:", result.content[0].text);
      } catch (e) {
        console.error("Parse erro:", responseData);
      }
    });
  });

  req.on("error", (e) => {
    console.error("Request erro:", e.message);
    console.error("Código do erro:", e.code);
  });

  req.write(data);
  req.end();
}

callClaude("Hello manual client test");
