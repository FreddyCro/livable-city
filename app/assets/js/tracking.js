// const gtmSrc = {
//   async: true,
//   src: 'https://www.googletagmanager.com/gtag/js?id=G-CQV5HGZQ93',
// };

// use this for ga function
const gtmSrc = {
  innerHTML: `
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','G-CQV5HGZQ93');
  `,
};

const gtmConfig = {
  innerHTML: `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-CQV5HGZQ93');
  `,
};

const comScore = {
  defer: true,
  innerHTML: `
    var _comscore = _comscore || [];
    _comscore.push({ c1: "2", c2: "7390954" });
    (function() {
    var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
    s.src = (document.location.protocol == "https:" ? "https://sb" : "http://b") + ".scorecardresearch.com/beacon.js";
    el.parentNode.insertBefore(s, el);
    })();
  `,
};

// noscript
const scorecardresearch = {
  tag: 'noscript',
  innerHTML: `
    <img src="http://b.scorecardresearch.com/p?c1=2&c2=7390954&cv=2.0&cj=1" />
  `,
};

const alexaCertify = {
  type: 'text/javascript',
  defer: true,
  innerHTML: `
    _atrk_opts = { atrk_acct:"aw0Di1a4ZP00aY", domain:"udn.com",dynamic: true};
    (function() { var as = document.createElement('script'); as.type = 'text/javascript'; as.async = true; as.src = "https://d31qbv1cthcecs.cloudfront.net/atrk.js"; var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(as, s); })();
  `,
};

// noscript
const cloudfront = {
  innerHTML: `
    <img src="https://d5nxst8fruw4z.cloudfront.net/atrk.gif?account=aw0Di1a4ZP00aY" style="display:none" height="1" width="1" />
  `,
};

const etu = {
  id: 'etu-recommender',
  type: 'text/javascript',
  defer: true,
  innerHTML: `
    //var atid=rId();
    // sLogin=GetCkValue("udnmember");
    var temp = window.location.href.split('/')
    var pid = ''
    if(temp.length > 3){
        pid = temp[temp.length-3] + '_' + temp[temp.length-2]
    }
    var erUrlPrefix='https://rec.udn.com/';
    var _qevents = _qevents || [];
    _qevents.push({
      group:'udn',
      cid : 'udn_soft',
      act : 'view',
      cat : ['newmedia','newmedia','','',''],
      uid : '',
      bid : '',
      pid : pid,
      page:'ARTICLE',
      Rank_cat:'10',
      Rank_pid:'10',
      title: document.querySelector('title').innerHTML,
      tag:[],
      referral: document.referrer
    });
    (function() {
      var er = document.createElement('script');
      er.type = 'text/javascript';
      er.async = true;
      er.src = erUrlPrefix + 'er.js?' + (new Date().getTime());
      var currentJs = document.getElementById('etu-recommender');
      currentJs.parentNode.insertBefore(er, currentJs);
    })();
  `,
};

function useTracking() {
  return {
    script: [gtmSrc, gtmConfig, comScore, alexaCertify, etu],
    noscript: [scorecardresearch, cloudfront],
  };
}

export {
  gtmSrc,
  gtmConfig,
  comScore,
  scorecardresearch,
  alexaCertify,
  cloudfront,
  etu,
  useTracking,
};
