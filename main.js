const form = document.getElementById("submitForm");
const titleInput = document.getElementById("title");
const locationInput = document.getElementById("location");
const timeInput = document.getElementById("time");
const descInput = document.getElementById("desc");

let userLat = 37.5665;
let userLng = 126.978;

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const show = {
    title: titleInput.value,
    location: locationInput.value,
    time: timeInput.value,
    desc: descInput.value,
    lat: userLat,
    lng: userLng
  };

  const shows = JSON.parse(localStorage.getItem("shows") || "[]");
  shows.push(show);
  localStorage.setItem("shows", JSON.stringify(shows));
  alert("공연이 등록되었습니다!");
  form.reset();
  loadMap();
});

function loadMap() {
  navigator.geolocation.getCurrentPosition(function(position) {
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;
    drawMap();
  }, drawMap);
}

function drawMap() {
  const map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(userLat, userLng),
    level: 5
  });

  const userMarker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(userLat, userLng),
    title: "내 위치"
  });

  const shows = JSON.parse(localStorage.getItem("shows") || "[]");
  shows.forEach(show => {
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(show.lat, show.lng),
      map: map
    });
    const infowindow = new kakao.maps.InfoWindow({
      content: "<div style='padding:5px'><strong>${show.title}</strong><br>${show.time}<br>${show.location}</div>"
    });
    kakao.maps.event.addListener(marker, 'click', () => infowindow.open(map, marker));
  });
}

loadMap();