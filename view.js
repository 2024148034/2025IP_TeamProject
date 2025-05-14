let userLat = 37.5665;
let userLng = 126.978;

function loadViewMap() {
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

  const bounds = new kakao.maps.LatLngBounds();

  const userMarker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(userLat, userLng),
    title: "내 위치",
    image: new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      new kakao.maps.Size(24, 35),
      { offset: new kakao.maps.Point(12, 35) }
    )
  });
  bounds.extend(userMarker.getPosition());

  loadLocalShows(map, bounds);
  loadOfflineSeoulEvents(map, bounds);
}

function loadLocalShows(map, bounds) {
  const shows = JSON.parse(localStorage.getItem("shows") || "[]");
  const now = new Date();
  const infowindow = new kakao.maps.InfoWindow();

  shows.forEach(show => {
    const lat = parseFloat(show.lat);
    const lng = parseFloat(show.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const showTime = new Date(show.time);
    if (showTime < now) return;

    const formattedDate = show.time.split("T")[0];
    const pos = new kakao.maps.LatLng(lat, lng);
    const marker = new kakao.maps.Marker({
      position: pos,
      map: map
    });

    bounds.extend(pos);

    const content = `<div style='padding:5px'><strong>${show.title}</strong><br>${formattedDate}<br>${show.location}</div>`;

    kakao.maps.event.addListener(marker, 'click', () => {
      infowindow.setContent(content);
      infowindow.open(map, marker);
    });
  });

  kakao.maps.event.addListener(map, 'click', () => {
    infowindow.close();
  });
}

function loadOfflineSeoulEvents(map, bounds) {
  fetch("culturalEvents.json")
    .then(res => res.json())
    .then(data => {
      const list = data.culturalEventInfo.row;
      const now = new Date();
      const infowindow = new kakao.maps.InfoWindow();

      list.forEach(event => {
        const latitude = parseFloat(event.LOT);
        const longitude = parseFloat(event.LAT);
        if (isNaN(latitude) || isNaN(longitude)) return;

        const endDateStr = event.END_DATE?.replace(/\./g, "-");
        if (!endDateStr) return;
        const endDate = new Date(endDateStr);
        if (endDate < now) return;

        const pos = new kakao.maps.LatLng(latitude, longitude);
        const marker = new kakao.maps.Marker({
          map: map,
          position: pos
        });

        bounds.extend(pos);

        // 날짜 포맷에서 시간 제거 (예: 2025-06-13 00:00:00.0 → 2025-06-13)
        const formatDate = dateStr => dateStr?.split(" ")[0] || "";
        const startFormatted = formatDate(event.STRTDATE);
        const endFormatted = formatDate(event.END_DATE);

        const content = `
          <div style="padding:5px; max-width:200px">
            <strong>${event.TITLE}</strong><br>
            장소: ${event.PLACE}<br>
            날짜: ${startFormatted} ~ ${endFormatted}<br>
          </div>`;

        kakao.maps.event.addListener(marker, 'click', () => {
          infowindow.setContent(content);
          infowindow.open(map, marker);
        });
      });

      kakao.maps.event.addListener(map, 'click', () => {
        infowindow.close();
      });
    })
    .catch(err => console.error("로컬 JSON 로딩 실패:", err));
}

loadViewMap();
