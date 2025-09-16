import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();

// 🔹 Common function to fetch, clean, and return HTML
async function fetchAndClean(url) {
  const response = await fetch(url);
  let html = await response.text();

  const $ = cheerio.load(html);

  // --------------------------
  // --- Existing cleanup ---
  $(".sp-megamenu-wrapper").remove();
  $("#sp-top-bar").remove();
  $("#sp-cookie-consent").remove();
  $(".sp-cookie-close.sp-cookie-allow").remove();
  $(".sp-cookie-wrapper").remove();
  $(".FloatingButton__FloatingButtonContainer-sc-78e7a0be-0.kimcfv").remove();
  $(".ButtonBase__ButtonContainer-sc-f9fbfeb2-3.fmYWVa.Bubble__BubbleComponent-sc-75c3757e-0.UjVBF").remove();
  $(".ButtonBase__ButtonContainer-sc-f9fbfeb2-3.Bubble__BubbleComponent-sc-75c3757e-0").remove();
  $("[class*='Bubble__BubbleComponent-sc-75c3757e-0']").remove();
  $(".ButtonBase__Overlay-sc-f9fbfeb2-4.iTcqZX").remove();
  $(".ButtonBase__ButtonContainer-sc-f9fbfeb2-3.fmYWVa.Bubble__BubbleComponent-sc-75c3757e-0.ifLzPE").remove();
  $(".ButtonBase__ButtonContainer-sc-f9fbfeb2-3.fmYWVa.Bubble__BubbleComponent-sc-75c3757e-0.jlvBOh").remove();
  $("#ymDivBar").remove();
  $("#button1_eraffle").remove();

  // Auto-click cookie accept
  $("head").append(`
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        const cookieBtn = document.querySelector(".sp-cookie-close.sp-cookie-allow");
        if (cookieBtn) cookieBtn.click();
      });
    </script>
  `);

  // Swipe/drag scroll script
  $("head").append(`
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        const tab = document.querySelector(".custom-tab");
        if (!tab) return;

        let isDown = false, startX, scrollLeft;

        tab.addEventListener("mousedown", e => {
          isDown = true;
          startX = e.pageX - tab.offsetLeft;
          scrollLeft = tab.scrollLeft;
        });
        tab.addEventListener("mouseleave", () => isDown = false);
        tab.addEventListener("mouseup", () => isDown = false);
        tab.addEventListener("mousemove", e => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - tab.offsetLeft;
          const walk = (x - startX);
          tab.scrollLeft = scrollLeft - walk;
        });

        let touchStartX = 0;
        tab.addEventListener("touchstart", e => {
          touchStartX = e.touches[0].clientX;
          scrollLeft = tab.scrollLeft;
        });
        tab.addEventListener("touchmove", e => {
          const x = e.touches[0].clientX;
          const walk = (x - touchStartX);
          tab.scrollLeft = scrollLeft - walk;
        });
      });
    </script>
  `);

  // Inject CSS (unchanged)
  $("head").append(`
    <style>
      [class*="FloatingButton__FloatingButtonContainer"],
      [class*="Bubble__BubbleComponent"],
      [class*="ButtonBase__Overlay"],
      #ymDivBar,
      #button1_eraffle {
        display: none !important;
      }

      .custom-tab {
        display: flex;
        align-items: center;
        background: #363636ff;
        height: 50px;
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: auto;
        white-space: nowrap;
        position: relative;
        overflow-y: hidden;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .custom-tab::-webkit-scrollbar { display: none; }

      .custom-tab::before,
      .custom-tab::after {
        content: "";
        position: sticky;
        top: 0;
        width: 40px;
        pointer-events: none;
        z-index: 20;
      }

      .custom-tab::before { left: 0; background: linear-gradient(to right, #363636ff 90%, transparent); }
      .custom-tab::after { right: 0; background: linear-gradient(to left, #363636ff 90%, transparent); }

      .custom-tab::-webkit-scrollbar-thumb { background: rgba(238, 255, 3, 0.97); border-radius: 3px; }

      .custom-tab a {
        display: inline-block;
        padding: 0 20px;
        text-align: center;
        color: #fff;
        font-weight: 600;
        text-decoration: none;
        line-height: 50px;
        white-space: nowrap;
        transition: background 0.3s ease;
      }

      .custom-tab a:hover,
      .custom-tab a.active { background: #747474ff; }
    </style>
  `);

  // --------------------------
  // --- Rewrite relative links & forms to local proxy ---
$('a').each((i, el) => {
  let href = $(el).attr('href');
  if (!href) return;

  // 🚨 Keep local proxy routes untouched
  if (["/lto", "/service", "/autocare", "/membership", "/about"].includes(href)) {
    return; // do nothing
  }

  // Rewrite absolute AAP links → /aap/*
  if (href.startsWith("https://aap.org.ph")) {
    href = href.replace("https://aap.org.ph", "/aap");
    $(el).attr("href", href);
  }

  // Rewrite Autocare links → /autocare/*
  else if (href.startsWith("https://autocare.aap.org.ph")) {
    href = href.replace("https://autocare.aap.org.ph", "/autocare");
    $(el).attr("href", href);
  }

  // Rewrite relative AAP links → /aap/*
  else if (href.startsWith("/")) {
    $(el).attr("href", "/aap" + href);
  }
});





  $('form').each((i, el) => {
    const action = $(el).attr('action');
    if (action && action.startsWith('/')) {
      $(el).attr('action', action); // forms post to localhost
    }
  });

  return $.html();
}

// --- Routes ---
app.get("/", async (req, res) => {
  try {
    const html = await fetchAndClean("https://aap.org.ph/");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching site");
  }
});


// Generic AAP proxy
app.get("/aap/*", async (req, res) => {
  try {
    // Rebuild the full external URL
    const externalUrl = "https://aap.org.ph" + req.path.replace("/aap", "");
    
    let html = await fetchAndClean(externalUrl);
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching " + req.originalUrl);
  }
});

app.get("/service", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/services/international-driving-permit");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/service" class="active">International Driving Permit</a>
        <a href="/autocare">Autocare</a>
        <a href="/lto">LTO Registration Assistance</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching service page");
  }
});



app.get("/lto", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/services/lto-registration-assistance");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/service">International Driving Permit</a>
        <a href="/autocare">Autocare</a>
        <a href="/lto" class="active">LTO Registration Assistance</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching LTO Registration Assistance page");
  }
});

app.get("/membership", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/membership");
    const $ = cheerio.load(html);

    // Inject Membership secondary nav
    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/membership/benefits">Benefits</a>
        <a href="/membership/lifestyle">Lifestyle</a>
        <a href="/membership/how-to-apply">How to Apply</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching membership page");
  }
});


app.get("/autocare", async (req, res) => {
  try {
    const html = await fetchAndClean("https://autocare.aap.org.ph/");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching autocare page");
  }
});

app.get("/about", async (req, res) => {
  try {
    const html = await fetchAndClean("https://aap.org.ph/about-aap");
    const $ = cheerio.load(html);

    // Inject a simpler nav for About section
    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/motorsport">Motor Sport</a>
        <a href="/roadsafety">Road Safety</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching about page");
  }
});


app.get("/motorsport", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/motorsport");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/motorsport" class="active">Motor Sport</a>
        <a href="/roadsafety">Road Safety</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Motor Sport page");
  }
});

app.get("/roadsafety", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/road-safety");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/motorsport">Motor Sport</a>
        <a href="/roadsafety" class="active">Road Safety</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Road Safety page");
  }
});


app.get("/membership/benefits", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/membership/benefits");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/membership/benefits" class="active">Benefits</a>
        <a href="/membership/lifestyle">Lifestyle</a>
        <a href="/membership/how-to-apply">How to Apply</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Membership Benefits page");
  }
});

app.get("/membership/lifestyle", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/membership/lifestyle");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/membership/benefits">Benefits</a>
        <a href="/membership/lifestyle" class="active">Lifestyle</a>
        <a href="/membership/how-to-apply">How to Apply</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Membership Lifestyle page");
  }
});

app.get("/membership/how-to-apply", async (req, res) => {
  try {
    let html = await fetchAndClean("https://aap.org.ph/membership/how-to-apply");
    const $ = cheerio.load(html);

    $("#sp-header").after(`
      <nav class="custom-tab">
        <a href="/membership/benefits">Benefits</a>
        <a href="/membership/lifestyle">Lifestyle</a>
        <a href="/membership/how-to-apply" class="active">How to Apply</a>
      </nav>
    `);

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Membership How to Apply page");
  }
});


app.listen(8080, () => console.log("Proxy running on http://localhost:8080"));
