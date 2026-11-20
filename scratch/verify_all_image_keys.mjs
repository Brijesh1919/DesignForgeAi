async function main() {
  const code = `
    const IMAGES = {
      heroJournal: "82661b2c9e1f741c022efd375bd7de85c5f85c0a",
      swatchNavy: "f44f1cdbedc29a6c042df9e1ca4e2bcbf24619b4",
      swatchTan: "6431f4bf4699b9c6f00a2d704f66e77818bb8d51",
      swatchBlack: "461b3ab29b75be77c438a1193451cda0d8b9b35f",
      awardsBanner: "7764c7873cf27acd6327f7f3b1158e8d654e888d",
      bannerTravel: "007bffdc38cfa9d8556b0bc47bf31b5a1b01996b",
      bannerNovelties: "13127cfcbfbd9d26786aef9ed1d42ea4cdcb7739",
      catDrinkware: "8c2c86ff168e10d0684e0887a1dc38a568e4aea4",
      catPadfolios: "9b83431cea20522cf8c83662107986fe963c39a8",
      catPower: "182cdeb67fc3e2e2192a54d1834f8d23f6997107",
      catBarware: "3b74d769d01c1a33c33e16d4c970cee3a5883019",
      catSpeakers: "ea9172b0097e0d71482f7189a1d2a6572b34f784",
      catCards: "3c358a04e40c80a00aa887885fda3efde8045c69",
      catCloseout: "078f34be8fd4044f0dc72bb76991d9cf13678564",
      catPackaging: "5c30b2184d90c81f3f7acf1d40febde701d2d8e4",
      catElectronics: "428b737ef35a3fa622f6100566bcb0b9690891af",
      catJournals: "b729c0ea162f3295b87ab1e29286d1f597a4bb12",
      catJrPadfolios: "79ad0b9023da240ef588f13eae21ff41f7c22ac3",
      catLuggage: "1df6e03eda027c1db065e5309e7b91f2a4efa295",
      catPens: "6c22fd29d21c191a1f9d02462112eb06bea2fe83",
      catMobile: "fbb791197d754422691fa7125d8d5fa859fcb916",
      catNovelties: "15db170b28816716ee7a9ba898990a4f36ec542a",
      catStylus: "be9659242bf942f2cebb471279c68fd2f3476e70",
      catTotes: "107246601519d03193e168c6c5089f4f980ae298",
      featTX2107: "3c358a04e40c80a00aa887885fda3efde8045c69",
      featTX2207: "d037801c046eefff34f019153a9ea91baffec9bb",
      featTX8810: "a24cc640c63753fe99f2489e131fdecef5f18b57",
      featTX916958: "2ad78b5fd5576d2b595c6a12360f0b2a57be09f8",
      featEX8067: "c78217a11b2e09bc3fef325a7db3a2c2c09e71ee",
      featDW8966: "c6841f4ff6daccda73c1f36dd03a50a757133582",
      catStrawTumblers: "2ed0f4607d2b4f55986b0c04fb60665ff1368772",
      catCorkMugs: "3a8cfd7c9c53d49da4f6e6493c2859370e07f1a9",
      catSportBottles: "ee8e280a84ef3debeb6b81932d83859518649fe6",
      catStainlessBottles: "8c2c86ff168e10d0684e0887a1dc38a568e4aea4",
      catWineTumblers: "62212da3c5ba1098f8340206e199c614a70cfb09",
      catSoftJournals: "f2f559acfbfafb8a084c136cb3fa21db8df128b3",
      catDebossedJournals: "b729c0ea162f3295b87ab1e29286d1f597a4bb12",
      catLeatherPadfolios: "9b83431cea20522cf8c83662107986fe963c39a8",
      catJrPadfolios2: "79ad0b9023da240ef588f13eae21ff41f7c22ac3",
      catMetalPens: "6c22fd29d21c191a1f9d02462112eb06bea2fe83",
      catStylusPens: "be9659242bf942f2cebb471279c68fd2f3476e70",
      catBrandedPower: "182cdeb67fc3e2e2192a54d1834f8d23f6997107",
      catBluetoothSpeakers: "515b6df18de175cd8074461a1b644900da203da6",
      catToteBags: "107246601519d03193e168c6c5089f4f980ae298",
      catLuggageTags: "1df6e03eda027c1db065e5309e7b91f2a4efa295",
      catCoasters: "3b74d769d01c1a33c33e16d4c970cee3a5883019",
      catChargingCables: "fbb791197d754422691fa7125d8d5fa859fcb916",
      catPetBagHolders: "15db170b28816716ee7a9ba898990a4f36ec542a",
      catGlassScale: "428b737ef35a3fa622f6100566bcb0b9690891af",
      catCloseoutAssort: "078f34be8fd4044f0dc72bb76991d9cf13678564",
      catGiftBoxes: "5c30b2184d90c81f3f7acf1d40febde701d2d8e4"
    };

    const checks = {};
    let missingCount = 0;
    for (const [k, hash] of Object.entries(IMAGES)) {
      const hasImg = !!figma.getImageByHash(hash);
      if (!hasImg) {
        checks[k] = "MISSING: " + hash;
        missingCount++;
      }
    }
    return {
      totalKeys: Object.keys(IMAGES).length,
      missingCount,
      missingDetails: checks
    };
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  console.log("Check images verification:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
