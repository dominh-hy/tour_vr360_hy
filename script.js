const map = L.map('map').setView([16.0471, 108.2062], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const SHEET_ID = "11hJ9Hfw8Mm9saT8BZsQKGpRlM1ba2SqM9vGvb68vZTI";  // ID Google Sheet của bạn
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let markers = [];

async function fetchData() {
  const response = await fetch(SHEET_URL);
  const text = await response.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  const rows = json.table.rows;
  return rows.map(row => ({
    name: row.c[0]?.v,
    lat: parseFloat(row.c[1]?.v),
    lng: parseFloat(row.c[2]?.v),
    desc_vi: row.c[3]?.v,
    desc_en: row.c[4]?.v,
    image1: row.c[5]?.v,
    image2: row.c[6]?.v,
    image3: row.c[7]?.v,
    category: row.c[8]?.v,
    province: row.c[9]?.v,
    video: row.c[10]?.v,
    vr360: row.c[11]?.v,
    openTime: row.c[12]?.v,
    status: row.c[13]?.v
  }));
}

function createPopupContent(data) {
  let images = '';
  if (data.image1) images += `<img src="${data.image1}" width="250"><br>`;
  if (data.image2) images += `<img src="${data.image2}" width="250"><br>`;
  if (data.image3) images += `<img src="${data.image3}" width="250"><br>`;

  return `
    <h3>${data.name}</h3>
    ${images}
    <b>Mô tả (VI):</b> ${data.desc_vi}<br>
    <b>Description (EN):</b> ${data.desc_en}<br>
    <b>Loại:</b> ${data.category} <br>
    <b>Tỉnh/TP:</b> ${data.province} <br>
    <b>Giờ mở cửa:</b> ${data.openTime || 'Không rõ'} <br>
    <b>Trạng thái:</b> ${data.status || 'Đang mở cửa'} <br>
    ${data.video ? `<iframe width="250" height="150" src="${data.video}" frameborder="0" allowfullscreen></iframe><br>` : ''}
    ${data.vr360 ? `<a href="${data.vr360}" target="_blank">🌐 Xem VR360</a><br>` : ''}
  `;
}

function renderSidebar(locations) {
  const list = document.getElementById('locationList');
  list.innerHTML = '';
  const filterCategory = document.getElementById('filterCategory');

  const categories = [...new Set(locations.map(l => l.category).filter(Boolean))];
  filterCategory.innerHTML = '<option value="">-- Lọc theo loại --</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.innerText = cat;
    filterCategory.appendChild(opt);
  });

  locations.forEach((data, index) => {
    const li = document.createElement('li');
    li.innerText = data.name;
    li.onclick = () => {
      map.setView([data.lat, data.lng], 14);
      markers[index].openPopup();
    };
    list.appendChild(li);
  });
}

async function main() {
  const locations = await fetchData();
  renderSidebar(locations);

  markers = locations.map(data => {
    const marker = L.marker([data.lat, data.lng]).addTo(map)
      .bindPopup(createPopupContent(data));
    return marker;
  });

  // Tìm kiếm địa điểm
  document.getElementById('searchBox').addEventListener('input', function(e) {
    const search = e.target.value.toLowerCase();
    const listItems = document.querySelectorAll('#locationList li');
    listItems.forEach(item => {
      item.style.display = item.innerText.toLowerCase().includes(search) ? '' : 'none';
    });
  });

  // Lọc theo loại
  document.getElementById('filterCategory').addEventListener('change', function(e) {
    const selected = e.target.value;
    const listItems = document.querySelectorAll('#locationList li');
    listItems.forEach((item, index) => {
      const match = locations[index].category === selected || selected === "";
      item.style.display = match ? '' : 'none';
      markers[index].setOpacity(match ? 1 : 0);
    });
  });

  // Hiện vị trí hiện tại
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      L.marker([latitude, longitude], { title: "Bạn đang ở đây" }).addTo(map);
    });
  }
}

main();
