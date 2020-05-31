const socket = io();

const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("#message");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $locationTemplate = document.querySelector("#location-template")
  .innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render($messageTemplate, {
    message: message.text,
    username: message.username,
    createdAt: moment(message.createdAt).format("MMM Do YYYY, h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("location-shared", (location) => {
  console.log(location);
  const html = Mustache.render($locationTemplate, {
    url: location.url,
    username: location.username,
    createdAt: moment(location.createdAt).format("MMM Do YYYY, h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  socket.emit("message-client", message, (message) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    console.log(message);
  });
});

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation not supported by your browser");
  }
  $locationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    data = {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    };
    socket.emit("send-location", data, () => {
      $locationButton.removeAttribute("disabled");
      console.log("Location shared");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
