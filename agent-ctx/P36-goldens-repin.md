# PHASE-036 — golden effective-configs re-pin table (the §18 lesson-5 relay)

> The SETTINGS-key wave (`purchasing.duplicate_invoice_tolerance_pct`, the one
> new registry key) lands in EVERY tenant's §5 policy map as a platform default,
> so all 40 pins moved; the six platform.* plan grants (0049 → business +
> enterprise) move the 27 business/enterprise + no-template-business pins a
> second notch. Starter pins carry the policy-default shift only. Recomputed by
> `apps/api/scripts/compute-goldens.ts` (checked-in this phase — the §18 lesson-5
> relay tool). Spec: 44/44 PASS.

| Case | old (PHASE-035) | new (PHASE-036) |
|---|---|---|
| industry.retail × starter | `sha256:e525efeb78c15addcf6089697fec32ee8d6ff8cd97ec2d0fb74e3ce9573590b0` | `sha256:473f672f17df6b42ea6b7aee60f92dbfffa7b689e498110224429f69d73b60b7` |
| industry.retail × business | `sha256:0f2a4888e81705e8a862b456c81df1e3af6e09ffea975b3ae22f993a151c1d1b` | `sha256:6d222ca084bf3f783c9f7a24382e282ef0446367e0a8d207bc7eda955ab8194a` |
| industry.retail × enterprise | `sha256:e7bac9b28ea9ff3cbc695454924abc1428116052d4b4d9b4a4e068f712a46b71` | `sha256:23af27016db8d43fba05403d5d9d70db7eec39d1fdcb233b16d3ca65d1b56311` |
| industry.grocery × starter | `sha256:fe7a524bf4bacad32abe91aeb601eb1b7d2640e84f201299757900c83e3cda12` | `sha256:43f26bb7b963691456624041d06845ace69e6f1fcdf325032cbca7c7279ba451` |
| industry.grocery × business | `sha256:9c4169670b533c0902c68abadb08056f6b498b35674f510006f6c81ca70a381e` | `sha256:d3ee4bc1ac4e24a08462728290e1a415630002d4bcfed7df888060b082f29683` |
| industry.grocery × enterprise | `sha256:6cae51a30ed7f976626d02e228a132be0aa1a1b4cc49d8d0d8462a415c34fce0` | `sha256:1d93d23695faa7638c21e49821479711673015f1db8aa82919539ab777e40de8` |
| industry.restaurant × starter | `sha256:b2b0282ea77f357ed2cc76f055677b730dd4cff4f5928cefdd4dc4dc933dd08a` | `sha256:5508289829299563ce372c1c19b030a869ca5dfc0f75be345b655200dccf131e` |
| industry.restaurant × business | `sha256:d24f1a63928af94dfb62a48ae8c3d0808f06f9011971157fc892187413c82306` | `sha256:0446502bd8098198033bbb1e36857816fda96c6de611bf3cdf12fa12817d2f3b` |
| industry.restaurant × enterprise | `sha256:304f57133800b99bef2ed8ef88ec2f496387a3c621f6541a071aa31fd55bf396` | `sha256:9ace3c3901e001468b6bd126841900f91547c76d9eaead7302a8b95fe1561643` |
| industry.automotive × starter | `sha256:1cb9c11baf7873e493709802ed201c7805903d3ee42741d6d630420638cc3666` | `sha256:22dcca3ccbdd5137e4bab5fb961e9df13bcd4b860cd5be4c6cc629aa50508af5` |
| industry.automotive × business | `sha256:7413c2e29226f81413686ba5e34245619bfb730fbae2ad177f55b55c8f584d0d` | `sha256:e0c31d1db3d3a943ae3740e472ccbad809b407e1427b494b7e40654b5d22efd4` |
| industry.automotive × enterprise | `sha256:97dd42fde0c1c686c9ebbde1ce6b853e087af31a1e374268986c613f18ebe0b7` | `sha256:95bc56e9a6135131f5ba2c13b92588c82c24d65709b91aab2be1a1171c2977be` |
| industry.distribution × starter | `sha256:c03f35e44d089ddda90af0069d043380b8f6c50b1da914a82324442e5b47d62f` | `sha256:0ce0f3318a7520b5597d05e154ff5fbabff285c3770cd0ff1391a31ec5d19ea2` |
| industry.distribution × business | `sha256:01e5bfd273931ae97592720db4357ca8cda52200b27f6cc402b07ca0d34b22f3` | `sha256:acd2de7b7fa3a0a31e94ed00bc7f11130858c6b4f2130852101ae6d96969d7d7` |
| industry.distribution × enterprise | `sha256:cad78e15c8fdff57744ca76c0eb60cddb034ee78deb471af079b45a801424333` | `sha256:42642ab25c5938dddf0df3e74ed1457377dead6fa830ab4aa15fe1ae18f6feae` |
| industry.food_manufacturing × starter | `sha256:fb496de31b577e963da725fcbb9b1528988526fc84885dd5e5544c57d068b8e4` | `sha256:e5441548a261f0dc522ad60f23596a8d9df460505c803b844b54e41ce63368de` |
| industry.food_manufacturing × business | `sha256:a3c8c4eace57c39b353ec69d7faa8ac90794ffa19eed1f74fe54c97e0e30b48d` | `sha256:1522ffb9e3a679aeb63f89ef94c311522576dda7a5716578d7a71f62db9f551d` |
| industry.food_manufacturing × enterprise | `sha256:527bcdfcd13ef5cc51123050f976ac1a035f513fc896c9dc5b1dfa2ad95aa13c` | `sha256:6cb3c52ca8cb84459eb1bbc3701d0add9198e1eb1d1d2a3d715b1a35e72d0a8a` |
| industry.professional_services × starter | `sha256:656b5db9953f991d981d6c57b4396190d94c64e35839a5818546513238a7c442` | `sha256:53f9eb7d4eb772123e701c9d03a4e1f9a36f6990049e5d15652a306506b6da52` |
| industry.professional_services × business | `sha256:c578368c1376630eb471bc567ad60c3ad9bb6f707c5d34ed4b7624fbb64c1a67` | `sha256:abc97635227a74f5f276874b5e39bad2773e0005e218b5296b4ca59f7ed35577` |
| industry.professional_services × enterprise | `sha256:5075ad930c05d602c6e1dcb4d6b2b7444d7e2193c1c4ecdfbbf96d6d178fc1a3` | `sha256:1f6131f2889a0d77280b9c30b389d55b388387ffc8d4eee9d038716335fc66cf` |
| industry.education × starter | `sha256:fa31c73e510ae07f6df0bb9361798714d3c9b8e62150b7d832a65d6ab3789155` | `sha256:a9f31038a96a27f277ec49e126f71529e1d6d3609547a78419dd1745f190e8bf` |
| industry.education × business | `sha256:fa30e5f34ada2657470769ec5f2b6a7ec368e423b26bfbada92e3cd94c626ea2` | `sha256:71645b724e60d364c1d33554a6e7d189ecacba7deccc935746bea22f7c0d8cf4` |
| industry.education × enterprise | `sha256:3796bd301894aab6c91ca079d02bc2f74d601318365d7cd7bf59eb6c8423e296` | `sha256:7dcee42154c38abb2367f42ef008014918f453d738a99412b7b3acc402ada0af` |
| industry.agriculture × starter | `sha256:ca0359cf03e3aacd523aa48c3adb7013b1ed47466f0288f74a5f0f67c6aaf835` | `sha256:e22a8eaf3fa5f84d72654d22a97842ec7fda9072a30f2c2eed2dafd8ca8c072e` |
| industry.agriculture × business | `sha256:7cac70be565c343d6916de5a08cdaa8ec32bc2be3e1572327e1d81a141eb12da` | `sha256:6ea140666ee87ce47aa1a93c8e8bd1828707f91f67940a77f762bbb652d6ff88` |
| industry.agriculture × enterprise | `sha256:4cb2b77ad42c3060d3631b3eb954f76fc361ca957a242163ed8286b2d9722653` | `sha256:34dfdc704fefd8d923971c2660fa3949ee66543f084e1e8d33650f622c9ab6fe` |
| industry.wholesale × starter | `sha256:86a74c472b45bd52b31794ad6b9a6fab3bbcb900a0e80ca7272ccf0669b43f17` | `sha256:3789bcd60cd3392b59da24c5ba0379462389c1039d9b52b0c02750d16d9b1342` |
| industry.wholesale × business | `sha256:59057bd3886f3ac0f17107120adde893fc5b146f4f03077d460fe94525f291b2` | `sha256:84e05a3f923d382df16dfb4bc778a1908e6808df208b4e2200f49ebdd9119151` |
| industry.wholesale × enterprise | `sha256:05ce42e8334c8050b4a343689493d0f5b96de9dd93e0b1b7b5ebbaf488fc21fb` | `sha256:18b7dfc0ed5b45518ba8084925db3194a1bd091828c508e8b189190ac5ccf89d` |
| industry.electronics × starter | `sha256:f393b9dff0fe48d8320e4715a5c389739eb0bb5c649e7695fcb3af27cec9a628` | `sha256:5b2230200542a7320039819c5239ddc80653e512412962f3ebc43a9770671454` |
| industry.electronics × business | `sha256:0078bc67dd63ee842c697385002f31029c93e7bccd3741c13c85186ae3845661` | `sha256:1850ea7b17b8ef6451f320fa415c491d426b49168530c96fb6e13e5fdf39a232` |
| industry.electronics × enterprise | `sha256:19556ce7c243ecce93948f79ac152d869e676bc22f205e0d44b1c20ba7bcc3ab` | `sha256:3a2552285eb34424667eb019af3b2ad32bc3c45061d8bf1de221f6390df34d5c` |
| industry.healthcare × starter | `sha256:40bae940339987ccffb511b7b7b84f114f68a89bd09ffa410037662e8da2536a` | `sha256:da3119398eae3f3e7ac1ccfbf4556092733804fcbf0db2d6ae42504931d4ec54` |
| industry.healthcare × business | `sha256:6fbfcc03135bd1bd49b0c2de9b19a8d9649eae56624bdd6541b185c5d18cbb82` | `sha256:0733cac98e119872f7bf5594beed44c5d2494fc723bfd1d95f2a47b6ca632516` |
| industry.healthcare × enterprise | `sha256:7b09450451c89e45025c5fa7605133f0843b5a3c1f6d9ce4b441bc0badef0ae3` | `sha256:bf139926deeeb14f6e85108bb3d1f3c21d29382e629b315411b5d1ac6700b591` |
| industry.rental_logistics × starter | `sha256:6bb3d0da9392b77eef3eed10471ef3625269fe693592f8e09242b3d9ff757814` | `sha256:c6bb7c3d0dbc571c4d900fef159adb58229f047ef7c14dc9ed0b8d0b1605824f` |
| industry.rental_logistics × business | `sha256:a3bff2f0167155f3918b5f4efc80a09fcaf2d2411ea880ca09213eab7faf0def` | `sha256:ac34aadf700feb17647db74f0c9a66588e0f224afbbc3f08f173c61a700e0fce` |
| industry.rental_logistics × enterprise | `sha256:210dff8331d925f5d97c2a4a4c5fe95fb7afbedeb35ec730c153654f036d34fe` | `sha256:7b2f7d15fdb677b292e479f82f6741b4e09dc53e0c0059424f47b180abacf1b0` |
| (no template) × business | `sha256:12f2c29435ada5bd25e02b145c593a50db382109af9690690992a900874b91f0` | `sha256:549459a64be39fa2a633379b10bcb38faeada91c687c309c7ff1d489ae2c2b94` |
