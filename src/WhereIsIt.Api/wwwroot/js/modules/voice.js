// ============================================================
// modules/voice.js — Multilingual Finder AI Voice Assistant ("Hey Finder")
// Supports English, Hindi, Punjabi, Spanish, French, German & More!
// ============================================================

let voiceAgentRecognition = null;
let isVoiceAgentListening = false;
let isAiSpeaking = false;
let ignoreSpeechUntil = 0;

function initVoiceAgent() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('SpeechRecognition API not available in this browser.');
        return;
    }

    voiceAgentRecognition = new SpeechRecognition();
    voiceAgentRecognition.lang = 'hi-IN'; // Default hybrid listening profile
    voiceAgentRecognition.interimResults = false;
    voiceAgentRecognition.continuous = false;

    voiceAgentRecognition.onstart = () => {
        isVoiceAgentListening = true;
        const orb = document.getElementById('siri-orb');
        if (orb && !isAiSpeaking) {
            orb.classList.add('listening');
            orb.classList.remove('speaking');
        }
        const statusText = document.getElementById('voice-agent-status');
        if (statusText && !isAiSpeaking) statusText.innerHTML = '🎙️ Listening... <span class="text-highlight">Speak now in any language!</span>';
    };

    voiceAgentRecognition.onresult = async (event) => {
        // Prevent acoustic feedback (AI hearing itself speaking through speakers)
        if (isAiSpeaking || window.speechSynthesis?.speaking || Date.now() < ignoreSpeechUntil) {
            console.log('Ignored audio feedback while AI is speaking');
            return;
        }

        const transcript = event.results[0][0].transcript;
        console.log('Voice recognized:', transcript);
        await processVoiceAgentCommand(transcript);
    };

    voiceAgentRecognition.onerror = (event) => {
        console.warn('Voice error:', event.error);
        isVoiceAgentListening = false;
        const orb = document.getElementById('siri-orb');
        if (orb && !isAiSpeaking) orb.classList.remove('listening');
        const statusText = document.getElementById('voice-agent-status');
        if (statusText && !isAiSpeaking) statusText.innerHTML = 'Tap the orb or speak in any language to try again.';
    };

    voiceAgentRecognition.onend = () => {
        isVoiceAgentListening = false;
        const orb = document.getElementById('siri-orb');
        if (orb && !isAiSpeaking) orb.classList.remove('listening');
    };
}

function openVoiceAgentModal() {
    openModal('modal-voice-agent');
    const transcriptCard = document.getElementById('voice-transcript-card');
    const responseCard = document.getElementById('voice-response-card');
    if (transcriptCard) transcriptCard.style.display = 'none';
    if (responseCard) responseCard.style.display = 'none';
    startVoiceAgentListening();
}

function startVoiceAgentListening() {
    if (!voiceAgentRecognition) {
        initVoiceAgent();
    }
    if (!voiceAgentRecognition) {
        showToast('Voice recognition not supported in this browser.', 'error');
        return;
    }

    const select = document.getElementById('voice-lang-select');
    if (select && select.value !== 'auto') {
        voiceAgentRecognition.lang = select.value;
    } else {
        voiceAgentRecognition.lang = 'hi-IN'; // Default multilingual hybrid
    }

    try {
        if (isVoiceAgentListening) {
            voiceAgentRecognition.stop();
        }
        voiceAgentRecognition.start();
    } catch (e) {
        console.warn('Start voice err:', e);
    }
}

// Multilingual Synonyms & Transliteration Dictionary
const SYNONYM_MAP = {
    // Phone
    'फोन': ['phone', 'mobile', 'smartphone', 'iphone'],
    'फ़ोन': ['phone', 'mobile', 'smartphone', 'iphone'],
    'फ़ोन': ['phone', 'mobile', 'smartphone', 'iphone'],
    'मोबाइल': ['phone', 'mobile', 'smartphone', 'iphone'],
    'मोबाईल': ['phone', 'mobile', 'smartphone', 'iphone'],
    'स्मार्टफोन': ['phone', 'mobile', 'smartphone', 'iphone'],
    'ਫੋਨ': ['phone', 'mobile', 'smartphone'],
    'ਮੋਬਾਈਲ': ['phone', 'mobile', 'smartphone'],
    'phone': ['phone', 'iphone', 'smartphone', 'mobile', 'फोन', 'मोबाइल'],
    'mobile': ['phone', 'smartphone', 'iphone', 'mobile', 'फोन', 'मोबाइल'],
    'smartphone': ['phone', 'smartphone', 'iphone', 'mobile'],
    'telefono': ['phone', 'mobile', 'smartphone', 'iphone'],
    'telephone': ['phone', 'mobile', 'smartphone', 'iphone'],
    
    // Keys
    'चाबी': ['keys', 'key', 'lock', 'चाबी'],
    'चाबियां': ['keys', 'key', 'lock'],
    'चाबीयां': ['keys', 'key', 'lock'],
    'चाबियाँ': ['keys', 'key', 'lock'],
    'ਕੁੰਜੀ': ['keys', 'key'],
    'ਚਾਬੀ': ['keys', 'key'],
    'keys': ['keys', 'key', 'चाबी', 'ਚਾਬੀ', 'llaves', 'cles', 'schlussel'],
    'key': ['keys', 'key', 'चाबी'],
    'llaves': ['keys', 'key'],
    'cles': ['keys', 'key'],

    // Charger
    'चार्जर': ['charger', 'adapter', 'cable', 'wire', 'चार्जर'],
    'चार्जिंग': ['charger', 'adapter', 'cable'],
    'ਚਾਰਜਰ': ['charger', 'adapter'],
    'charger': ['charger', 'adapter', 'cable', 'चार्जर', 'ਚਾਰਜਰ'],
    'cargador': ['charger', 'adapter'],
    'chargeur': ['charger', 'adapter'],

    // Passport
    'पासपोर्ट': ['passport', 'pass port', 'पासपोर्ट', 'ਪਾਸਪੋਰਟ'],
    'ਪਾਸਪੋਰਟ': ['passport'],
    'passport': ['passport', 'पासपोर्ट', 'id', 'document', 'ਪਾਸਪੋਰਟ'],
    'pasaporte': ['passport', 'document'],

    // Laptop
    'लैपटॉप': ['laptop', 'macbook', 'computer', 'लैपटॉप', 'ਲੈਪਟਾਪ'],
    'ਲੈਪਟਾਪ': ['laptop', 'macbook'],
    'laptop': ['laptop', 'macbook', 'computer', 'notebook', 'लैपटॉप'],

    // Wallet
    'वॉलेट': ['wallet', 'purse', 'money', 'वॉलेट', 'बटुवा'],
    'बटुवा': ['wallet', 'purse'],
    'पर्स': ['wallet', 'purse'],
    'wallet': ['wallet', 'purse', 'cardholder', 'वॉलेट'],

    // Clothes / Jacket
    'जैकेट': ['jacket', 'coat', 'जैकेट', 'ਜੈਕਟ'],
    'jacket': ['jacket', 'coat', 'blazer', 'जैकेट'],
    'कपड़े': ['clothes', 'jacket', 'shirt'],
    'clothes': ['clothes', 'jacket', 'shirt', 'dress'],

    // Drill / Tools
    'ड्रिल': ['drill', 'power drill', 'tool', 'ड्रिल'],
    'drill': ['drill', 'power drill', 'tool', 'ड्रिल']
};

// Location & Room Synonyms Map
const LOCATION_SYNONYM_MAP = {
    // Bedroom / Room
    'बेडरूम': 'Bedroom',
    'बेड रूम': 'Bedroom',
    'कमरा': 'Bedroom',
    'कमरे': 'Bedroom',
    'सोने का कमरा': 'Bedroom',
    'ਕਮਰਾ': 'Bedroom',
    'bedroom': 'Bedroom',
    'room': 'Bedroom',
    'dormitorio': 'Bedroom',
    'habitacion': 'Bedroom',
    'chambre': 'Bedroom',
    'schlafzimmer': 'Bedroom',

    // Living Room / Hall
    'लिविंग रूम': 'Living Room',
    'लिविंगरूम': 'Living Room',
    'हाल': 'Living Room',
    'हॉल': 'Living Room',
    'बैठक': 'Living Room',
    'ड्राइंग रूम': 'Living Room',
    'living room': 'Living Room',
    'living': 'Living Room',
    'hall': 'Living Room',
    'salon': 'Living Room',
    'wohnzimmer': 'Living Room',

    // Kitchen
    'किचन': 'Kitchen',
    'रसोई': 'Kitchen',
    'रसोईघर': 'Kitchen',
    'रसोई घर': 'Kitchen',
    'ਰਸੋਈ': 'Kitchen',
    'kitchen': 'Kitchen',
    'cocina': 'Kitchen',
    'cuisine': 'Kitchen',
    'kuche': 'Kitchen',

    // Garage
    'गैराज': 'Garage',
    'गैरेज': 'Garage',
    'गाड़ी की जगह': 'Garage',
    'ਗੈਰੇਜ': 'Garage',
    'garage': 'Garage',

    // Study / Desk / Table / Drawer
    'स्टडी': 'Study Table',
    'स्टडी टेबल': 'Study Table',
    'स्टडी रूम': 'Study Room',
    'टेबल': 'Study Table',
    'मेज': 'Study Table',
    'डेस्क': 'Study Table',
    'दराज': 'Drawer',
    'ड्रायर': 'Drawer',
    'study': 'Study Table',
    'table': 'Study Table',
    'desk': 'Study Table',
    'drawer': 'Drawer',

    // Wardrobe / Closet / Cupboard / Shelf
    'अलमारी': 'Wardrobe',
    'कवर्ड': 'Cupboard',
    'शेल्फ': 'Shelf',
    'अलमीरा': 'Wardrobe',
    'wardrobe': 'Wardrobe',
    'closet': 'Wardrobe',
    'shelf': 'Shelf',
    'cupboard': 'Cupboard',

    // Balcony / Terrace
    'बालकनी': 'Balcony',
    'छत': 'Terrace',
    'balcony': 'Balcony',
    'terrace': 'Terrace'
};

function resolveLocationName(rawLoc) {
    if (!rawLoc) return 'Bedroom';
    const clean = rawLoc.toLowerCase().trim();
    if (LOCATION_SYNONYM_MAP[clean]) return LOCATION_SYNONYM_MAP[clean];

    for (const [key, val] of Object.entries(LOCATION_SYNONYM_MAP)) {
        if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
            return val;
        }
    }

    return rawLoc.charAt(0).toUpperCase() + rawLoc.slice(1);
}

function findMatchingItemInState(searchTerm) {
    if (!searchTerm) return null;
    const termLower = searchTerm.toLowerCase().trim();
    if (!termLower) return null;

    // 1. Direct match on item name
    let match = state.items.find(i => 
        i.name.toLowerCase() === termLower ||
        i.name.toLowerCase().includes(termLower) || 
        termLower.includes(i.name.toLowerCase())
    );
    if (match) return match;

    // 2. Transliteration / Synonym expansion lookup
    let candidates = [termLower];
    for (const [key, synList] of Object.entries(SYNONYM_MAP)) {
        if (termLower.includes(key.toLowerCase()) || key.toLowerCase().includes(termLower)) {
            candidates.push(...synList);
        }
    }

    for (const cand of candidates) {
        const cLower = cand.toLowerCase();
        match = state.items.find(i => 
            i.name.toLowerCase() === cLower ||
            i.name.toLowerCase().includes(cLower) || 
            cLower.includes(i.name.toLowerCase()) ||
            (i.categoryName && i.categoryName.toLowerCase().includes(cLower)) ||
            (i.brand && i.brand.toLowerCase().includes(cLower))
        );
        if (match) return match;
    }

    // 3. Fallback: Check individual words
    const tokens = termLower.split(/\s+/);
    for (const t of tokens) {
        if (t.length >= 2) {
            match = state.items.find(i => i.name.toLowerCase().includes(t));
            if (match) return match;
        }
    }

    return null;
}

// Language Detector for Multi-language Queries (Auto-detects Devanagari, Gurmukhi, English, Spanish, etc.)
function detectSpokenLanguage(text) {
    const raw = text.trim();
    const lower = text.toLowerCase();

    // Check script Unicode ranges
    if (/[\u0900-\u097F]/.test(raw)) {
        return 'hi-IN'; // Hindi (Devanagari script like "फोन", "चाबी")
    }
    if (/[\u0A00-\u0A7F]/.test(raw)) {
        return 'pa-IN'; // Punjabi (Gurmukhi script like "ਫੋਨ")
    }

    // Punjabi Romanized Detection
    if (lower.includes('kithe') || lower.includes('peya') || lower.includes('payi') || lower.includes('rakhya') || 
        lower.includes('vich') || lower.includes('ditta') || lower.includes('tuhada') || lower.includes('labho') || 
        lower.includes('ch ')) {
        return 'pa-IN';
    }

    // Spanish Detection
    if (lower.includes('donde') || lower.includes('esta') || lower.includes('estan') || lower.includes('puse') || 
        lower.includes('guarde') || lower.includes('habitacion') || lower.includes('dormitorio') || lower.includes('cocina')) {
        return 'es-ES';
    }

    // French Detection
    if (lower.includes('ou est') || lower.includes('ou sont') || lower.includes('chambre') || lower.includes('cuisine') || 
        lower.includes('trouve') || lower.includes('j\'ai mis') || lower.includes('dans')) {
        return 'fr-FR';
    }

    // German Detection
    if (lower.includes('wo ist') || lower.includes('wo sind') || lower.includes('schlafzimmer') || lower.includes('gelegt') || 
        lower.includes('kuche') || lower.includes('habe ich')) {
        return 'de-DE';
    }

    // Hindi Romanized Detection
    if (lower.includes('kahan') || lower.includes('kidhar') || lower.includes('rakha') || lower.includes('rakhi') || 
        lower.includes('rakh') || lower.includes('mera') || lower.includes('meri') || lower.includes('apna') || 
        lower.includes('batao') || lower.includes('dhoondo') || lower.includes('hai')) {
        return 'hi-IN';
    }

    // Default to English
    return 'en-US';
}

function speakVoiceResponse(text, langCode = 'en-US', onEndCallback = null) {
    if (!window.speechSynthesis) return;
    
    // Cancel any previous audio immediately
    window.speechSynthesis.cancel();

    // Mute speech recognition immediately while AI speaks
    isAiSpeaking = true;
    ignoreSpeechUntil = Date.now() + 120000;
    if (voiceAgentRecognition && isVoiceAgentListening) {
        try { voiceAgentRecognition.stop(); } catch(e) {}
        isVoiceAgentListening = false;
    }

    const orb = document.getElementById('siri-orb');
    if (orb) {
        orb.classList.remove('listening');
        orb.classList.add('speaking');
    }

    const statusText = document.getElementById('voice-agent-status');
    if (statusText) statusText.innerHTML = '🔊 <strong>Finder AI Speaking...</strong>';

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text.trim());
        
        if (langCode.startsWith('pa') || langCode.startsWith('hi')) {
            utterance.lang = 'hi-IN';
        } else {
            utterance.lang = langCode;
        }
        
        utterance.rate = 0.92;
        utterance.pitch = 1.02;

        const voices = window.speechSynthesis.getVoices();
        let matchingVoice = null;

        if (langCode.startsWith('pa') || langCode.startsWith('hi')) {
            matchingVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().includes('hi_in')) ||
                            voices.find(v => v.lang.toLowerCase().includes('pa-in') || v.lang.toLowerCase().includes('pa_in')) ||
                            voices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('india')) ||
                            voices.find(v => v.lang.toLowerCase().startsWith('hi'));
        } else {
            matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()));
        }

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
            isAiSpeaking = true;
            if (voiceAgentRecognition && isVoiceAgentListening) {
                try { voiceAgentRecognition.stop(); } catch(e) {}
                isVoiceAgentListening = false;
            }
        };

        utterance.onend = () => {
            isAiSpeaking = false;
            ignoreSpeechUntil = Date.now() + 800;
            if (orb) orb.classList.remove('speaking');
            if (statusText) statusText.innerHTML = 'Tap the orb or speak in any language to ask again.';
            if (onEndCallback) onEndCallback();
        };

        utterance.onerror = () => {
            isAiSpeaking = false;
            ignoreSpeechUntil = Date.now() + 300;
            if (orb) orb.classList.remove('speaking');
            if (statusText) statusText.innerHTML = 'Tap the orb or speak in any language to ask again.';
        };

        try {
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Speech synthesis speak error:', e);
        }
    }, 450);
}

// Universal Multilingual NLP Command Engine
async function processVoiceAgentCommand(spokenText) {
    const rawText = spokenText.trim();
    const lower = rawText.toLowerCase();
    const detectedLang = detectSpokenLanguage(rawText);

    // Update transcript and language badge
    const transcriptCard = document.getElementById('voice-transcript-card');
    const transcriptText = document.getElementById('voice-transcript-text');
    const langBadge = document.getElementById('voice-transcript-lang-badge');

    const langLabels = {
        'en-US': '🇺🇸 English',
        'hi-IN': '🇮🇳 Hindi',
        'pa-IN': '🇮🇳 Punjabi',
        'es-ES': '🇪🇸 Spanish',
        'fr-FR': '🇫🇷 French',
        'de-DE': '🇩🇪 German'
    };

    if (transcriptCard && transcriptText) {
        transcriptCard.style.display = 'block';
        transcriptText.textContent = `"${rawText}"`;
        if (langBadge) langBadge.textContent = `YOU SAID (${langLabels[detectedLang] || 'Auto-Detected'}):`;
    }

    const responseCard = document.getElementById('voice-response-card');
    const responseText = document.getElementById('voice-response-text');
    const actionSlot = document.getElementById('voice-action-result-slot');
    if (responseCard) responseCard.style.display = 'block';
    if (actionSlot) actionSlot.innerHTML = '';

    // 1. SAVE / RECORD / RELOCATE INTENT
    const saveKeywords = [
        'रखा', 'रखी', 'रखे', 'रख', 'डाला', 'डाली', 'डाले', 'रख दिया', 'रख दी', 'सेव', 'ਰੱਖਿਆ', 'ਰੱਖੀ', 'ਦਿੱਤਾ',
        'rakha', 'rakh', 'rakhi', 'rakhe', 'rakhya', 'ditta', 'paya', 'paaya', 'kept', 'put', 'placed', 'save', 'saved', 'stored', 'shift', 'moved',
        'guarde', 'puse', 'coloque', 'guardado', 'mis', 'enregistre', 'place', 'gelegt', 'gestellt', 'gespeichert'
    ];
    const isSaveCommand = saveKeywords.some(kw => lower.includes(kw));

    const postpositionSeps = [' में ', ' मे ', ' पे ', ' पर ', ' के अंदर ', ' vich ', ' ch ', ' me ', ' mein '];
    const prepositionSeps = [' in ', ' inside ', ' on ', ' at ', ' en ', ' dans ', ' im ', ' in der '];

    const postSep = postpositionSeps.find(sep => lower.includes(sep));
    const prepSep = prepositionSeps.find(sep => lower.includes(sep));

    if (isSaveCommand && (postSep || prepSep)) {
        let itemPart = '';
        let locPart = '';

        if (postSep) {
            const parts = lower.split(postSep);
            const left = parts[0].trim();
            const right = parts.slice(1).join(postSep).trim();

            let cleanedLeft = left
                .replace(/hey finder/g, '').replace(/finder/g, '')
                .replace(/hey khoji/g, '').replace(/khoji/g, '')
                .replace(/hey siri/g, '').replace(/hey agent/g, '')
                .replace(/मैंने अपना/g, '').replace(/मैंने अपनी/g, '').replace(/मैंने अपने/g, '').replace(/मैंने/g, '')
                .replace(/मैं अपना/g, '').replace(/मैं अपनी/g, '').replace(/मैं/g, '')
                .replace(/अपना/g, '').replace(/अपनी/g, '').replace(/अपने/g, '')
                .replace(/मेरा/g, '').replace(/मेरी/g, '').replace(/मेरे/g, '')
                .replace(/ਮੈਂ ਆਪਣਾ/g, '').replace(/ਮੈਂ ਆਪਣੀ/g, '').replace(/ਮੈਂ/g, '')
                .replace(/maine apna/g, '').replace(/maine apni/g, '').replace(/maine apne/g, '').replace(/maine/g, '')
                .replace(/main apna/g, '').replace(/main apni/g, '').replace(/main/g, '')
                .replace(/ko/g, '').replace(/को/g, '').replace(/nu/g, '').replace(/ਨੂੰ/g, '')
                .trim();

            let foundLocKey = null;
            for (const locKey of Object.keys(LOCATION_SYNONYM_MAP)) {
                if (cleanedLeft.endsWith(locKey) || cleanedLeft.includes(' ' + locKey) || cleanedLeft === locKey) {
                    foundLocKey = locKey;
                    break;
                }
            }

            if (!foundLocKey) {
                for (const l of state.locations) {
                    if (cleanedLeft.toLowerCase().includes(l.name.toLowerCase())) {
                        foundLocKey = l.name.toLowerCase();
                        break;
                    }
                }
            }

            if (foundLocKey) {
                locPart = foundLocKey;
                itemPart = cleanedLeft.replace(new RegExp(foundLocKey + '$', 'i'), '')
                                      .replace(new RegExp(foundLocKey, 'i'), '')
                                      .trim();
            } else {
                locPart = cleanedLeft;
                itemPart = right
                    .replace(/रखा है/g, '').replace(/रख दिया है/g, '').replace(/रख दिया/g, '').replace(/रखी है/g, '').replace(/रखे हैं/g, '').replace(/रखा/g, '').replace(/रख/g, '')
                    .replace(/rakha hai/g, '').replace(/rakh diya/g, '').replace(/rakhi hai/g, '').replace(/rakh do/g, '')
                    .replace(/rakhya hai/g, '').replace(/rakh ditta/g, '').replace(/ditta/g, '')
                    .replace(/hai/g, '').replace(/है/g, '').replace(/ਹੈ/g, '')
                    .trim();
            }
        } else if (prepSep) {
            const parts = lower.split(prepSep);
            itemPart = parts[0]
                .replace(/hey finder/g, '').replace(/finder/g, '')
                .replace(/hey khoji/g, '').replace(/khoji/g, '')
                .replace(/hey siri/g, '').replace(/hey agent/g, '')
                .replace(/i kept my/g, '').replace(/i put my/g, '').replace(/i placed my/g, '')
                .replace(/i kept/g, '').replace(/i put/g, '').replace(/save/g, '').replace(/put/g, '')
                .replace(/guarde mi/g, '').replace(/puse mi/g, '').replace(/guarde/g, '').replace(/puse/g, '')
                .replace(/j'ai mis mon/g, '').replace(/j'ai mis ma/g, '').replace(/j'ai mis/g, '')
                .replace(/ich habe mein/g, '').replace(/ich habe meine/g, '').replace(/ich habe/g, '')
                .trim();

            locPart = parts[1]
                .replace(/the/g, '').replace(/el/g, '').replace(/la/g, '').replace(/le/g, '')
                .replace(/gelegt/g, '').replace(/gestellt/g, '')
                .trim();
        }

        if (!itemPart) itemPart = 'Item';
        if (!locPart) locPart = 'Bedroom';

        let cleanItemName = itemPart.charAt(0).toUpperCase() + itemPart.slice(1);
        for (const [k, v] of Object.entries(SYNONYM_MAP)) {
            if (itemPart.toLowerCase() === k.toLowerCase() || itemPart.toLowerCase().includes(k.toLowerCase())) {
                cleanItemName = v[0].charAt(0).toUpperCase() + v[0].slice(1);
                break;
            }
        }

        const cleanLocName = resolveLocationName(locPart);

        let targetLocation = state.locations.find(l => 
            l.name.toLowerCase() === cleanLocName.toLowerCase() ||
            l.name.toLowerCase().includes(cleanLocName.toLowerCase()) ||
            cleanLocName.toLowerCase().includes(l.name.toLowerCase())
        );

        if (!targetLocation) {
            const createLocRes = await apiFetch('/locations', {
                method: 'POST',
                body: JSON.stringify({
                    placeId: state.activePlaceId,
                    name: cleanLocName,
                    icon: 'room'
                })
            });
            if (createLocRes.success) {
                targetLocation = createLocRes.data;
                await loadLocations();
            } else {
                targetLocation = state.locations[0];
            }
        }

        let existingItem = findMatchingItemInState(cleanItemName) || findMatchingItemInState(itemPart);
        if (existingItem) {
            const moveRes = await apiFetch(`/items/${existingItem.id}/move`, {
                method: 'POST',
                body: JSON.stringify({
                    newLocationId: targetLocation.id,
                    reason: `Voice Command (${langLabels[detectedLang] || 'Multilingual'})`
                })
            });

            if (moveRes.success) {
                await loadItems();
                renderDashboard();
                renderAllItemsView();

                let speech = '';
                if (detectedLang === 'hi-IN') speech = `Theek hai! Maine aapka ${existingItem.name}, ${targetLocation.name} me shift kar diya hai.`;
                else if (detectedLang === 'pa-IN') speech = `Theek hai ji! Main tuhada ${existingItem.name}, ${targetLocation.name} vich move kar ditta hai.`;
                else if (detectedLang === 'es-ES') speech = `¡Listo! He movido tu ${existingItem.name} a ${targetLocation.name}.`;
                else if (detectedLang === 'fr-FR') speech = `C'est fait ! J'ai déplacé votre ${existingItem.name} vers ${targetLocation.name}.`;
                else if (detectedLang === 'de-DE') speech = `Erledigt! Ich habe dein ${existingItem.name} nach ${targetLocation.name} verschoben.`;
                else speech = `Got it! I have moved your ${existingItem.name} to ${targetLocation.name}.`;

                if (responseText) responseText.textContent = speech;
                if (actionSlot) {
                    actionSlot.innerHTML = `
                        <div class="item-path-box">
                            <span class="material-symbols-outlined" style="color: var(--accent-emerald);">check_circle</span>
                            <strong>${existingItem.name}</strong> ➔ ${moveRes.data.locationPath}
                        </div>
                    `;
                }
                speakVoiceResponse(speech, detectedLang);
                showToast(`Updated: ${existingItem.name} ➔ ${targetLocation.name}`, 'success');
                return;
            }
        } else {
            let categoryId = state.categories[0]?.id;
            const itemLower = cleanItemName.toLowerCase();
            if (itemLower.includes('charger') || itemLower.includes('phone') || itemLower.includes('laptop') || itemLower.includes('remote') || itemLower.includes('battery') || itemLower.includes('earphone')) {
                categoryId = state.categories.find(c => c.name === 'Electronics')?.id || categoryId;
            } else if (itemLower.includes('passport') || itemLower.includes('document') || itemLower.includes('file') || itemLower.includes('card')) {
                categoryId = state.categories.find(c => c.name === 'Documents')?.id || categoryId;
            } else if (itemLower.includes('jacket') || itemLower.includes('shirt') || itemLower.includes('clothes') || itemLower.includes('shoes')) {
                categoryId = state.categories.find(c => c.name === 'Clothing')?.id || categoryId;
            } else if (itemLower.includes('drill') || itemLower.includes('tool') || itemLower.includes('hammer')) {
                categoryId = state.categories.find(c => c.name === 'Tools')?.id || categoryId;
            }

            const createItemRes = await apiFetch('/items', {
                method: 'POST',
                body: JSON.stringify({
                    name: cleanItemName,
                    categoryId: categoryId,
                    locationId: targetLocation.id,
                    condition: 'Good',
                    quantity: 1,
                    description: `Recorded via Finder AI Voice (${langLabels[detectedLang] || 'Multilingual'})`
                })
            });

            if (createItemRes.success) {
                await loadItems();
                renderDashboard();
                renderAllItemsView();

                let speech = '';
                if (detectedLang === 'hi-IN') speech = `Maine aapka ${cleanItemName}, ${targetLocation.name} me save kar diya hai!`;
                else if (detectedLang === 'pa-IN') speech = `Main tuhada ${cleanItemName}, ${targetLocation.name} vich save kar ditta hai ji!`;
                else if (detectedLang === 'es-ES') speech = `¡He guardado tu ${cleanItemName} en ${targetLocation.name}!`;
                else if (detectedLang === 'fr-FR') speech = `J'ai enregistré votre ${cleanItemName} dans ${targetLocation.name} !`;
                else if (detectedLang === 'de-DE') speech = `Ich habe dein ${cleanItemName} in ${targetLocation.name} gespeichert!`;
                else speech = `I have saved your ${cleanItemName} in ${targetLocation.name}!`;

                if (responseText) responseText.textContent = speech;
                if (actionSlot) {
                    actionSlot.innerHTML = `
                        <div class="item-path-box">
                            <span class="material-symbols-outlined" style="color: var(--accent-emerald);">add_task</span>
                            <strong>${cleanItemName}</strong> ➔ ${createItemRes.data.locationPath}
                        </div>
                    `;
                }
                speakVoiceResponse(speech, detectedLang);
                showToast(`Saved: ${cleanItemName} in ${targetLocation.name}`, 'success');
                return;
            }
        }
    }

    // 2. FIND INTENT
    let searchTerm = lower
        .replace(/hey finder/g, '').replace(/finder/g, '')
        .replace(/hey khoji/g, '').replace(/khoji/g, '')
        .replace(/hey siri/g, '').replace(/hey agent/g, '')
        .replace(/where is my/g, '').replace(/where did i put my/g, '').replace(/where did i put/g, '')
        .replace(/where is the/g, '').replace(/where are my/g, '').replace(/where are/g, '').replace(/where is/g, '')
        .replace(/find my/g, '').replace(/find the/g, '').replace(/find/g, '')
        .replace(/कहाँ है/g, '').replace(/कहाँ रखा है/g, '').replace(/कहाँ रखी है/g, '').replace(/कहाँ/g, '')
        .replace(/कहा है/g, '').replace(/कहा रखा है/g, '').replace(/किधर है/g, '').replace(/किधर/g, '')
        .replace(/मेरा/g, '').replace(/मेरी/g, '').replace(/मेरे/g, '').replace(/अपना/g, '').replace(/अपनी/g, '')
        .replace(/ढूंढो/g, '').replace(/बताओ/g, '').replace(/दिखाओ/g, '')
        .replace(/ਕਿੱਥੇ ਹੈ/g, '').replace(/ਕਿੱਥੇ ਪਿਆ ਹੈ/g, '').replace(/ਕਿੱਥੇ/g, '').replace(/ਲੱਭੋ/g, '')
        .replace(/ਮੇਰਾ/g, '').replace(/ਮੇਰੀ/g, '').replace(/ਆਪਣਾ/g, '')
        .replace(/kahan hai/g, '').replace(/kahan rakha hai/g, '').replace(/kahan rakhi hai/g, '').replace(/kidhar hai/g, '').replace(/kahan/g, '').replace(/kidhar/g, '')
        .replace(/kithe hai/g, '').replace(/kithe peya hai/g, '').replace(/kithe pya hai/g, '').replace(/kithe payi hai/g, '').replace(/kithe/g, '')
        .replace(/dhoondo/g, '').replace(/batao/g, '').replace(/labho/g, '').replace(/hai/g, '').replace(/है/g, '').replace(/ਹੈ/g, '')
        .replace(/donde esta mi/g, '').replace(/donde estan mis/g, '').replace(/donde puse mi/g, '').replace(/donde esta/g, '').replace(/donde/g, '')
        .replace(/encuentra mi/g, '').replace(/encuentra/g, '')
        .replace(/ou est mon/g, '').replace(/ou est ma/g, '').replace(/ou sont mes/g, '').replace(/ou ai-je mis/g, '').replace(/ou est/g, '')
        .replace(/trouve mon/g, '').replace(/trouve/g, '')
        .replace(/wo ist mein/g, '').replace(/wo ist meine/g, '').replace(/wo sind meine/g, '').replace(/wo habe ich/g, '').replace(/wo ist/g, '')
        .replace(/finde mein/g, '').replace(/finde/g, '')
        .trim();

    if (!searchTerm) searchTerm = lower;

    const matchedItem = findMatchingItemInState(searchTerm);

    if (matchedItem) {
        let speech = '';
        const locPathClean = matchedItem.locationPath.replace(/→/g, ', ');

        if (detectedLang === 'hi-IN') speech = `Ji! Aapka ${matchedItem.name}, ${locPathClean} me rakha hai.`;
        else if (detectedLang === 'pa-IN') speech = `Ji! Tuhada ${matchedItem.name}, ${locPathClean} vich peya hai ji.`;
        else if (detectedLang === 'es-ES') speech = `¡Aquí está! Tu ${matchedItem.name} está en ${locPathClean}.`;
        else if (detectedLang === 'fr-FR') speech = `Le voilà ! Votre ${matchedItem.name} se trouve dans ${locPathClean}.`;
        else if (detectedLang === 'de-DE') speech = `Hier ist es! Dein ${matchedItem.name} befindet sich in ${locPathClean}.`;
        else speech = `Found it! Your ${matchedItem.name} is in ${locPathClean}.`;

        if (responseText) responseText.textContent = speech;
        if (actionSlot) {
            actionSlot.innerHTML = `
                <div class="item-path-box">
                    <span class="material-symbols-outlined">pin_drop</span>
                    <strong>${matchedItem.name}</strong> ➔ ${matchedItem.locationPath}
                </div>
            `;
        }
        speakVoiceResponse(speech, detectedLang);
        return;
    }

    const matchedLoc = state.locations.find(l => lower.includes(l.name.toLowerCase()));
    if (matchedLoc) {
        const locItems = state.items.filter(i => i.locationId === matchedLoc.id);
        if (locItems.length > 0) {
            const itemNames = locItems.map(i => i.name).join(', ');
            let speech = '';
            if (detectedLang === 'hi-IN') speech = `Ji! ${matchedLoc.name} me yeh items hain: ${itemNames}.`;
            else if (detectedLang === 'pa-IN') speech = `Ji! ${matchedLoc.name} vich eh samaan peya hai: ${itemNames}.`;
            else if (detectedLang === 'es-ES') speech = `¡Aquí está! En ${matchedLoc.name} se encuentran: ${itemNames}.`;
            else if (detectedLang === 'fr-FR') speech = `Dans ${matchedLoc.name}, il y a : ${itemNames}.`;
            else if (detectedLang === 'de-DE') speech = `In ${matchedLoc.name} befindet sich: ${itemNames}.`;
            else speech = `In ${matchedLoc.name}, you have: ${itemNames}.`;

            if (responseText) responseText.textContent = speech;
            speakVoiceResponse(speech, detectedLang);
            return;
        }
    }

    const serverSearch = await apiFetch(`/search?q=${encodeURIComponent(searchTerm)}`);
    if (serverSearch.success && serverSearch.data.totalMatches > 0) {
        const first = serverSearch.data.items[0];
        const locPathClean = first.locationPath.replace(/→/g, ', ');
        let speech = '';

        if (detectedLang === 'hi-IN') speech = `Ji! Aapka ${first.name}, ${locPathClean} me hai.`;
        else if (detectedLang === 'pa-IN') speech = `Ji! Tuhada ${first.name}, ${locPathClean} vich hai ji.`;
        else if (detectedLang === 'es-ES') speech = `¡Aquí está! Tu ${first.name} está en ${locPathClean}.`;
        else if (detectedLang === 'fr-FR') speech = `Le voilà ! Votre ${first.name} est dans ${locPathClean}.`;
        else if (detectedLang === 'de-DE') speech = `Hier ist es! Dein ${first.name} ist in ${locPathClean}.`;
        else speech = `Found it! Your ${first.name} is in ${locPathClean}.`;

        if (responseText) responseText.textContent = speech;
        if (actionSlot) {
            actionSlot.innerHTML = `
                <div class="item-path-box">
                    <span class="material-symbols-outlined">pin_drop</span>
                    <strong>${first.name}</strong> ➔ ${first.locationPath}
                </div>
            `;
        }
        speakVoiceResponse(speech, detectedLang);
    } else {
        let speech = '';
        if (detectedLang === 'hi-IN') speech = `Mujhe "${searchTerm}" nahi mila. Aap keh sakte hain: "Maine ${searchTerm} bedroom me rakha hai" aur main save kar dunga.`;
        else if (detectedLang === 'pa-IN') speech = `Mainu "${searchTerm}" nahi milya ji. Tusi keh sakde ho: "Main ${searchTerm} bedroom vich rakh ditta" te main save kar lavanga.`;
        else if (detectedLang === 'es-ES') speech = `No encontré "${searchTerm}". Puedes decir: "Guardé ${searchTerm} en el dormitorio" para guardarlo.`;
        else if (detectedLang === 'fr-FR') speech = `Je n'ai pas trouvé "${searchTerm}". Vous pouvez dire : "J'ai mis ${searchTerm} dans la chambre".`;
        else speech = `I couldn't find "${searchTerm}". You can say: "I kept ${searchTerm} in bedroom" to record it.`;
        if (responseText) responseText.textContent = speech;
        speakVoiceResponse(speech, detectedLang);
    }
}

function startVoiceRecognition() {
    openVoiceAgentModal();
}
