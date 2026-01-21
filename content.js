(() => {
  const TOGGLE_KEY = Symbol.for("romanianCyrillicOriginal");

  // Helper to match the case of the replacement to the original text
  function matchCase(source, target) {
    if (!source || !target) return target;
    const first = source[0];
    // Check if the source is capitalized or uppercase
    if (first === first.toUpperCase()) {
      // If the whole word is upper, return upper target
      if (source.length > 1 && source === source.toUpperCase()) {
        return target.toUpperCase();
      }
      // Otherwise, just capitalize the first letter
      return target.charAt(0).toUpperCase() + target.slice(1);
    }
    return target.toLowerCase();
  }

  // Specialized replacements ordered by specificity (ligatures -> context -> simple)
  const REPLACEMENTS = [
    // 1. Normalize Latin diacritics (cedilla to comma) to ensure consistent matching
    { regex: /ş/g, replacement: "ș" }, { regex: /Ş/g, replacement: "Ș" },
    { regex: /ţ/g, replacement: "ț" }, { regex: /Ţ/g, replacement: "Ț" },

    // 2. Hard Consonant Digraphs (ch/gh become hard K/G)
    // "chi" -> "ки", "ghe" -> "ге"
    { regex: /ch/gi, replacement: "к" },
    { regex: /gh/gi, replacement: "г" },

    // 3. Soft Consonant Groups (Assibilation)
    // C/G before soft vowels often absorb the vowel or change the consonant
    
    // cea/cia -> "chya" (чя)
    { regex: /c[ei]a/gi, replacement: "чя" },
    // cio -> "cho" (чо)
    { regex: /cio/gi, replacement: "чо" },
    // ciu -> "chu" (чу)
    { regex: /ciu/gi, replacement: "чу" },
    // ce/ci -> "che/chi" (че/чи)
    { regex: /ce/gi, replacement: "че" },
    { regex: /ci/gi, replacement: "чи" },

    // gea/gia -> "zhe-ya" (ӂя)
    { regex: /g[ei]a/gi, replacement: "ӂя" },
    // gio -> "zhe-o" (ӂо)
    { regex: /gio/gi, replacement: "ӂо" },
    // giu -> "zhe-u" (ӂу)
    { regex: /giu/gi, replacement: "ӂу" },
    // ge/gi -> "zhe/zhi" (ӂе/ӂи)
    { regex: /ge/gi, replacement: "ӂе" },
    { regex: /gi/gi, replacement: "ӂи" },

    // 4. Diphthongs
    // ea -> ya (я), ia -> ya (я)
    { regex: /ea/gi, replacement: "я" },
    { regex: /ia/gi, replacement: "я" },
    // ie -> e (е) (e.g., muiere -> муере)
    { regex: /ie/gi, replacement: "е" },
    // iu -> yu (ю)
    { regex: /iu/gi, replacement: "ю" },

    // 5. "I" Subtleties
    // Final double "ii" becomes "iy" (ий) (e.g., codrii -> кодрий)
    { regex: /ii\b/gi, replacement: "ий" },
    
    // "i" after any vowel becomes short "й" (e.g., câine -> кыйне)
    // We capture the vowel to preserve it (it might be Latin or mapped later)
    { regex: /([aăâîeou])i/gi, replacement: "$1й" },

    // "i" at the end of a word (after a consonant) becomes soft sign "ь" (e.g., ochi -> окь)
    // Matching common consonants (including converted ones potentially, though we operate on Latin mostly)
    { regex: /([bcdfghjklmnpqrstvwxzșț])i\b/gi, replacement: "$1ь" }
  ];

  const SIMPLE_MAP = {
    // Vowels
    "a": "а", "A": "А",
    "ă": "э", "Ă": "Э", // schwa is Э
    "â": "ы", "Â": "Ы", // hard vowel is Ы
    "î": "ы", "Î": "Ы", // hard vowel is Ы
    "e": "е", "E": "Е",
    "i": "и", "I": "И", // standard i
    "o": "о", "O": "О",
    "u": "у", "U": "У",

    // Consonants
    "b": "б", "B": "Б",
    "c": "к", "C": "К", // Hard C (soft C handled by regex)
    "d": "д", "D": "Д",
    "f": "ф", "F": "Ф",
    "g": "г", "G": "Г", // Hard G (soft G handled by regex)
    "h": "х", "H": "Х",
    "j": "ж", "J": "Ж",
    "k": "к", "K": "К",
    "l": "л", "L": "Л",
    "m": "м", "M": "М",
    "n": "н", "N": "Н",
    "p": "п", "P": "П",
    "r": "р", "R": "Р",
    "s": "с", "S": "С",
    "ș": "ш", "Ș": "Ш",
    "t": "т", "T": "Т",
    "ț": "ц", "Ț": "Ц",
    "v": "в", "V": "В",
    "x": "кс", "X": "КС",
    "z": "з", "Z": "З"
  };

  function toCyrillic(text) {
    let result = text;

    // Apply regex replacements for complex cases
    for (const { regex, replacement } of REPLACEMENTS) {
      result = result.replace(regex, (match, ...args) => {
        // Handle regex group substitution ($1) combined with case matching
        if (replacement.includes("$")) {
          let replaced = replacement;
          const groups = args.slice(0, -2); // exclude offset and original string
          
          // Substitute groups (e.g. $1)
          for (let i = 0; i < groups.length; i++) {
            replaced = replaced.replace(`$${i+1}`, groups[i]);
          }

          // Determine case for the non-group part (suffix)
          // We assume the suffix follows the case of the last character of the match
          const suffix = replacement.replace(/\$\d/g, ""); 
          const lastChar = match[match.length - 1];
          const isUpper = lastChar && (lastChar === lastChar.toUpperCase()) && (lastChar !== lastChar.toLowerCase());
          const correctSuffix = isUpper ? suffix.toUpperCase() : suffix;
          
          return groups[0] + correctSuffix;
        }
        return matchCase(match, replacement);
      });
    }

    // Map remaining single characters
    return result.split("").map(ch => SIMPLE_MAP[ch] || ch).join("");
  }

  let enabled = document.body.dataset.__romanianCyrillicEnabled === "1";
  enabled = !enabled;
  document.body.dataset.__romanianCyrillicEnabled = enabled ? "1" : "0";

  function walk(node, enable) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (enable) {
        if (!node[TOGGLE_KEY]) {
          node[TOGGLE_KEY] = node.nodeValue;
          node.nodeValue = toCyrillic(node.nodeValue);
        }
      } else {
        if (node[TOGGLE_KEY]) {
          node.nodeValue = node[TOGGLE_KEY];
          delete node[TOGGLE_KEY];
        }
      }
    } else {
      node.childNodes.forEach(child => walk(child, enable));
    }
  }

  walk(document.body, enabled);
  chrome.runtime.sendMessage({ toggleCyrillic: enabled });
})();
