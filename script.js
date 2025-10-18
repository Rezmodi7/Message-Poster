// =========================
// 🌐 تنظیمات شبکه و قرارداد
// =========================
const RPC_URL = "https://zenchain-testnet.api.onfinality.io/public";
const CHAIN_ID = 8408; // Decimal
const CONTRACT_ADDRESS = "0x7Ae1cf69B20862cC643ce50E7b5b879F43f48619";

const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true,"internalType": "address","name": "sender","type": "address"},
			{"indexed": false,"internalType": "string","name": "message","type": "string"},
			{"indexed": false,"internalType": "uint256","name": "timestamp","type": "uint256"},
			{"indexed": false,"internalType": "bytes32","name": "txHashShort","type": "bytes32"}
		],
		"name": "MessagePosted",
		"type": "event"
	},
	{
		"inputs": [
			{"internalType": "string","name": "message","type": "string"}
		],
		"name": "postMessage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// =========================
// 🧩 انتخاب المنت‌های UI
// =========================
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const statusDiv = document.getElementById("status");
const accountInfo = document.getElementById("accountInfo");
const appArea = document.getElementById("appArea");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const txStatus = document.getElementById("txStatus");
const lastTx = document.getElementById("lastTx");
const langToggle = document.getElementById("langToggle");

// =========================
// 🌍 سیستم چند زبانه
// =========================
let currentLang = "fa";

const langData = {
  fa: {
    title: "ثبت پیام روی ZenChain Testnet",
    status: "وضعیت: قطع",
    statusConnected: "وضعیت: متصل",
    statusDisconnected: "وضعیت: قطع",
    connectBtn: "اتصال کیف‌پول",
    disconnectBtn: "قطع اتصال (محلی)",
    formTitle: "ارسال پیام",
    messageLabel: "پیام کوتاه (حداکثر 200 کاراکتر)",
    sendBtn: "ارسال تراکنش",
    footerText: "شبکه: ZenChain Testnet — Chain ID: 8408 — واحد: ZTC",
    address: "آدرس",
    pleaseConnect: "ابتدا کیف‌پول را متصل کنید.",
    enterMsg: "پیام را وارد کنید.",
    sending: "در حال ارسال تراکنش...",
    txSent: "تراکنش ارسال شد:",
    txConfirmed: "تراکنش تایید شد ✅",
    txFailed: "تراکنش شکست خورد ❌"
  },
  en: {
    title: "Post Message on ZenChain Testnet",
    status: "Status: Disconnected",
    statusConnected: "Status: Connected",
    statusDisconnected: "Status: Disconnected",
    connectBtn: "Connect Wallet",
    disconnectBtn: "Disconnect (Local)",
    formTitle: "Send Message",
    messageLabel: "Short message (max 200 chars)",
    sendBtn: "Send Tx",
    footerText: "Network: ZenChain Testnet — Chain ID: 8408 — Currency: ZTC",
    address: "Address",
    pleaseConnect: "Please connect your wallet first.",
    enterMsg: "Enter your message.",
    sending: "Sending transaction...",
    txSent: "Transaction sent:",
    txConfirmed: "Transaction confirmed ✅",
    txFailed: "Transaction failed ❌"
  }
};

// دکمه تغییر زبان
langToggle.onclick = () => {
  currentLang = currentLang === "fa" ? "en" : "fa";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "fa" ? "rtl" : "ltr";
  langToggle.innerText = currentLang === "fa" ? "EN" : "FA";
  translatePage();
};

function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (langData[currentLang][key]) {
      el.innerText = langData[currentLang][key];
    }
  });
}

// =========================
// 🦊 اتصال به کیف پول
// =========================
let provider, signer, userAddress;

async function connectWallet() {
  if (!window.ethereum) {
    alert(currentLang === "fa" ? "MetaMask یا Rabby نصب نیست." : "No wallet found. Install MetaMask or Rabby.");
    return;
  }

  // اضافه کردن شبکه ZenChain در صورت نبود
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x20E8', // 8408 به هگز
        chainName: 'ZenChain Testnet',
        nativeCurrency: { name: 'Zen Test Coin', symbol: 'ZTC', decimals: 18 },
        rpcUrls: [RPC_URL]
      }]
    });
  } catch (e) {
    console.warn("Network add error", e);
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    statusDiv.innerText = langData[currentLang].statusConnected;
    accountInfo.innerText = `${langData[currentLang].address}: ${shortAddr(userAddress)}`;
    appArea.classList.remove("hidden");
  } catch (e) {
    alert(e.message);
  }
}

// قطع اتصال محلی
function disconnectLocal() {
  provider = null;
  signer = null;
  userAddress = null;
  statusDiv.innerText = langData[currentLang].statusDisconnected;
  accountInfo.innerText = "";
  appArea.classList.add("hidden");
}

// =========================
// ✉️ ارسال پیام به قرارداد
// =========================
async function sendMessage() {
  if (!signer) {
    alert(langData[currentLang].pleaseConnect);
    return;
  }

  const msg = messageInput.value.trim();
  if (!msg) {
    alert(langData[currentLang].enterMsg);
    return;
  }

  try {
    txStatus.innerText = langData[currentLang].sending;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contract.postMessage(msg);
    txStatus.innerText = `${langData[currentLang].txSent} ${tx.hash}`;
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      txStatus.innerText = langData[currentLang].txConfirmed;
      lastTx.innerText = `Tx: ${tx.hash}`;
    } else {
      txStatus.innerText = langData[currentLang].txFailed;
    }
  } catch (e) {
    txStatus.innerText = e.message;
  }
}

// نمایش آدرس کوتاه
function shortAddr(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

// =========================
// 🚀 اجرای اولیه
// =========================
connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectLocal;
sendBtn.onclick = sendMessage;

window.addEventListener("load", () => {
  statusDiv.innerText = langData[currentLang].statusDisconnected;
  translatePage();
});
