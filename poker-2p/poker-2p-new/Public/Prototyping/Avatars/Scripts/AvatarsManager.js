//@input Component.ScriptComponent packets
//@input Component.ScriptComponent playersManager
//@input Component.ScriptComponent connectedController
//@input int broadcastMovementEveryMS = 500
//@input SceneObject positionReference
//@input Asset.ObjectPrefab[] avatarPrefabs
//@input bool runAvatarMock = true;\

var packets = script.packets.api;
var playersManager = script.playersManager.api;
var connectedController = script.connectedController.api

// This script will instaniate a prefab
// for every player who is in the session
// It will share each players position and rotation

// Avatar movement data
// ====================

// Sharing
// -------
print('Starting avatar manager');
var movementBroadcastValue = packets.makeBroadcastValue('/avatar/movement/', connectedController.getState().userId);

var shareMovement = utils.throttle(function () {
    var transform = script.positionReference.getTransform();
    movementBroadcastValue.set(serialiseMovementData(transform.getWorldPosition(), transform.getWorldRotation()));
}, script.broadcastMovementEveryMS);

script.createEvent('UpdateEvent').bind(shareMovement);

// Receiving
// ---------

movementBroadcastValue.on(function (value, cid, userId) {
    var data = deserializeMovementData(value);
    playersManager.setPlayerValueForKey(userId, 'avatarPosition', data.position);
    playersManager.setPlayerValueForKey(userId, 'avatarOrientation', data.orientation);
});

// Data serialzing
// ---------------
function serialiseMovementData(position, orientation) {
    return [
        position.x, position.y, position.z,
        orientation.w, orientation.x, orientation.y, orientation.z
    ].join(' ');
}

function deserializeMovementData(str) {
    var arr = str.split(' ').map(parseFloat);
    return {
        position: new vec3(arr[0], arr[1], arr[2]),
        orientation: new quat(arr[3], arr[4], arr[5], arr[6])
    }
}

// Avatar scene object
// ===================

var avatarSceneObjects = {};
var avatarPrefabIdx = -1;

playersManager.onPlayersUpdated(function (players) {

    var avatarUsersIds = Object.keys(avatarSceneObjects);

    var playerUserIdsWithAvatarMovement = Object.keys(players).filter(function (playerId) {
        var player = players[playerId];
        return typeof player.avatarPosition !== 'undefined' && typeof player.avatarOrientation !== 'undefined';
    });

    // Remove avatars for players who have left (or dont' have movement data)
    avatarUsersIds.forEach(function (key) {
        if (playerUserIdsWithAvatarMovement.indexOf(key) === -1) {
            avatarSceneObjects[key].destroy();
            delete avatarSceneObjects[key];
        }
    });

    // Create any missing avatar scene objects
    playerUserIdsWithAvatarMovement.forEach(function (key) {
        if (avatarUsersIds.indexOf(key) === -1) {
            if (++avatarPrefabIdx >= script.avatarPrefabs.length) {
                avatarPrefabIdx = 0;
            }
            var avatarSceneObject = script.avatarPrefabs[avatarPrefabIdx].instantiate(script.getSceneObject());
            avatarSceneObject.name = key;
            avatarSceneObject.enabled = true;
            avatarSceneObjects[key] = avatarSceneObject;
            print('Created a avatar for:' + key);
        }
    });

});

// Avatar mockings
if (script.runAvatarMock) {
    startMockAvatars();
}

function startMockAvatars() {
    makeMockAvatar('mock1', 'Fred Flintstone', 0);
    makeMockAvatar('mock3', 'Wilma Flintstone ', 0.2);
    makeMockAvatar('mock4', 'Barney Rubble', 0.4);
    makeMockAvatar('mock5', 'Betty Rubble', 0.7);
}

script.api.enableFakeAvatars = function () {
    startMockAvatars();
}

function makeMockAvatar(playerId, displayName, offset ) {
    var mockData = makeMockData();
    mockData.setOffsetScalar(offset);
    var updateIdx = 0;

    // Update joined
    playersManager.addPlayer(playerId);
    playersManager.setPlayerValueForKey(playerId, 'displayName', displayName);

    // Update movement  
    script
        .createEvent('UpdateEvent')
        .bind(utils.throttle(function () {
            var data = deserializeMovementData(mockData.getAt(updateIdx++));
            playersManager.setPlayerValueForKey(playerId, 'avatarPosition', data.position);
            playersManager.setPlayerValueForKey(playerId, 'avatarOrientation', data.orientation);
        }, script.broadcastMovementEveryMS));
}

function makeMockData() {
    var offset = 0;
    var data = [
        "-1.6920182704925537 0.072330042719841 -1.517133355140686 0.9577734470367432 -0.28445863723754883 -0.038153886795043945 -0.017253777012228966",
        "-1.7355269193649292 0.44181936979293823 -1.5739120244979858 0.9590036273002625 -0.27984505891799927 -0.04053562879562378 -0.01885896362364292",
        "-2.116975784301758 0.2534137964248657 -2.760315418243408 0.9582456946372986 -0.2828986942768097 -0.03733791410923004 -0.018426410853862762",
        "-1.9746730327606201 0.2984641492366791 -2.2561275959014893 0.9582424759864807 -0.28348666429519653 -0.03377482295036316 -0.01631205342710018",
        "-2.2026562690734863 0.17382965981960297 -2.933861017227173 0.9582139253616333 -0.28403449058532715 -0.030915072187781334 -0.013954532332718372",
        "-3.5632853507995605 -2.9614853858947754 -1.3348230123519897 0.9586760401725769 -0.28286615014076233 -0.022097408771514893 -0.02094680443406105",
        "-4.0608344078063965 -5.36842679977417 -3.310044050216675 0.9545442461967468 -0.29373887181282043 -0.04108932614326477 -0.02957064099609852",
        "-6.531614780426025 -7.38162899017334 -12.265790939331055 0.9453759789466858 -0.31225496530532837 -0.08661763370037079 -0.03547420725226402",
        "2.860593795776367 -7.541762351989746 -31.913476943969727 0.9550893306732178 -0.2954104244709015 -0.016594622284173965 -0.016176769509911537",
        "9.20205307006836 -5.828812122344971 -48.696006774902344 0.9518211483955383 -0.30134838819503784 0.051117122173309326 0.02475195750594139",
        "6.452016353607178 -7.791317462921143 -46.7936897277832 0.9409049153327942 -0.33413630723953247 0.05406029149889946 0.011333536356687546",
        "-4.713521957397461 -8.853472709655762 -28.747421264648438 0.9476428627967834 -0.31827783584594727 0.025569060817360878 -0.004298074170947075",
        "-5.712599277496338 -9.687944412231445 -26.64565086364746 0.9454686641693115 -0.32425782084465027 0.030737711116671562 -0.0010707078035920858",
        "14.594464302062988 -8.301508903503418 -44.417423248291016 0.9522567391395569 -0.305218368768692 -0.000696424045599997 -0.006954804062843323",
        "25.581541061401367 -3.4257876873016357 -58.93804931640625 0.9558549523353577 -0.27724042534828186 0.08788557350635529 0.04189679026603699",
        "33.684104919433594 -11.528310775756836 -71.96318817138672 0.9050303101539612 -0.3279148042201996 0.24060244858264923 0.12450914084911346",
        "43.66657638549805 -9.815185546875 -73.91220092773438 0.7976737022399902 -0.287082314491272 0.49489906430244446 0.1907237321138382",
        "70.6846923828125 -9.959259986877441 -74.6970443725586 0.7597320675849915 -0.27769121527671814 0.554603099822998 0.19521886110305786",
        "85.18972778320312 -10.626326560974121 -79.30535125732422 0.7909654974937439 -0.30527451634407043 0.4987310767173767 0.18013499677181244",
        "86.18046569824219 -14.085308074951172 -85.78792572021484 0.8177088499069214 -0.3542923629283905 0.41591164469718933 0.18123705685138702",
        "78.00489807128906 0.6598976254463196 -80.30374908447266 0.833558201789856 -0.21278400719165802 0.4955182373523712 0.11985628306865692",
        "79.67925262451172 4.022149562835693 -77.60643768310547 0.7215248346328735 -0.15986788272857666 0.6595817804336548 0.1370985358953476",
        "85.02942657470703 -4.677812099456787 -98.19153594970703 0.7180323004722595 -0.232834592461586 0.6230999231338501 0.20485153794288635",
        "80.46732330322266 -6.903831481933594 -125.39867401123047 0.755029022693634 -0.2650698721408844 0.5714582800865173 0.1819472461938858",
        "65.3967056274414 -0.8877366781234741 -152.82655334472656 0.7209242582321167 -0.17240193486213684 0.6440936326980591 0.18891623616218567",
        "64.12215423583984 4.6241230964660645 -154.93341064453125 0.5000041127204895 -0.10074485093355179 0.8367218971252441 0.199356347322464",
        "72.2542953491211 1.83356511592865 -160.17034912109375 0.34450265765190125 -0.10163809359073639 0.9043192267417908 0.23063935339450836",
        "73.7320327758789 -0.046098221093416214 -163.04847717285156 0.32983189821243286 -0.0916835367679596 0.9042510986328125 0.25521591305732727",
        "60.24967575073242 -5.675051689147949 -162.73666381835938 0.3923831582069397 -0.13430209457874298 0.8598803877830505 0.2976648509502411",
        "41.4056282043457 -2.4588205814361572 -160.88629150390625 0.4884263873100281 -0.13306090235710144 0.82015061378479 0.26662230491638184",
        "42.43506622314453 -2.9287655353546143 -158.24163818359375 0.45761874318122864 -0.13324563205242157 0.834583580493927 0.276226669549942",
        "58.20252990722656 -2.045773983001709 -163.7201690673828 0.3135876953601837 -0.09395250678062439 0.9076084494590759 0.26283568143844604",
        "74.10733032226562 3.5585620403289795 -177.51727294921875 0.1678059995174408 -0.03852273151278496 0.9717280864715576 0.16156010329723358",
        "75.7178955078125 3.518449544906616 -183.30593872070312 0.1520562320947647 -0.02532460354268551 0.9788423776626587 0.13455602526664734",
        "75.4212875366211 3.4366049766540527 -184.4512481689453 0.1517460197210312 -0.02439226396381855 0.9778387546539307 0.14216049015522003",
        "66.61231994628906 -2.752436876296997 -174.89500427246094 0.2303648293018341 -0.06603248417377472 0.9404327869415283 0.24115990102291107",
        "48.10009765625 -6.953167915344238 -159.49252319335938 0.3895227611064911 -0.12775591015815735 0.8628254532814026 0.29577475786209106",
        "42.824153900146484 -7.558132648468018 -159.49594116210938 0.46713995933532715 -0.15390262007713318 0.8191289901733398 0.2951642572879791",
        "49.593780517578125 -8.73451042175293 -186.74493408203125 0.5364300012588501 -0.20587541162967682 0.7720075249671936 0.27177706360816956",
        "54.980308532714844 -7.649281024932861 -213.32080078125 0.5785580277442932 -0.20403987169265747 0.7411724925041199 0.2725832462310791",
        "40.62220764160156 -7.034582138061523 -223.82940673828125 0.5963031649589539 -0.20474058389663696 0.732318103313446 0.2573208212852478",
        "7.113433837890625 -6.8953142166137695 -220.82371520996094 0.5055206418037415 -0.15280327200889587 0.7976654767990112 0.2912556529045105",
        "-7.7286696434021 -3.627242088317871 -210.61990356445312 0.28382623195648193 -0.07727724313735962 0.9175229072570801 0.26762422919273376",
        "-19.33997344970703 -6.143825054168701 -204.07070922851562 0.0005592270754277706 0.008648836053907871 0.9521685838699341 0.30545029044151306",
        "-28.537425994873047 -10.246550559997559 -191.90415954589844 -0.11718839406967163 0.0498870313167572 0.934889554977417 0.33130010962486267",
        "-40.41130828857422 -8.147137641906738 -190.18870544433594 -0.20429472625255585 0.0557854026556015 0.9211171865463257 0.3266417980194092",
        "-55.91445541381836 -9.922294616699219 -194.69485473632812 -0.24321027100086212 0.08179186284542084 0.9048444628715515 0.3397284150123596",
        "-62.47990798950195 -5.925486087799072 -193.1566162109375 -0.22641243040561676 0.07105346769094467 0.9244480729103088 0.29847046732902527",
        "-59.143585205078125 -6.013086318969727 -186.1046905517578 -0.2036229819059372 0.06834977865219116 0.930622935295105 0.29632267355918884",
        "-36.211021423339844 -5.136694431304932 -170.71060180664062 -0.1879822015762329 0.05971112847328186 0.9374324679374695 0.2869105041027069",
        "-6.466206073760986 6.801931381225586 -173.30886840820312 -0.3946110010147095 0.0800192654132843 0.8987814784049988 0.1734100878238678",
        "6.52449893951416 -7.174594879150391 -185.79421997070312 -0.5096124410629272 0.15834791958332062 0.8058901429176331 0.25644174218177795",
        "-13.912761688232422 -13.269355773925781 -191.4283905029297 -0.4164043664932251 0.1716122031211853 0.8322443962097168 0.3233049809932709",
        "-44.32561492919922 -3.2502646446228027 -192.27708435058594 -0.22724413871765137 0.07970722019672394 0.9355626106262207 0.2583208680152893",
        "-58.20122528076172 4.931395053863525 -195.85263061523438 -0.14311596751213074 0.03561432287096977 0.9699802994728088 0.1933593451976776",
        "-55.51521682739258 -1.6234633922576904 -195.7887725830078 -0.19495560228824615 0.05211716517806053 0.9412305355072021 0.2708529233932495",
        "-30.27394676208496 -2.5631260871887207 -200.48544311523438 -0.39154836535453796 0.08598862588405609 0.8805603981018066 0.2528027892112732",
        "2.3360595703125 -1.730180025100708 -210.1279296875 -0.530200183391571 0.10297086089849472 0.8121804594993591 0.22056251764297485",
        "21.251705169677734 2.5172340869903564 -216.51242065429688 -0.5777066946029663 0.10201935470104218 0.7896830439567566 0.17957720160484314",
        "43.773929595947266 5.324142932891846 -214.51170349121094 -0.5240836143493652 0.06806369125843048 0.8328526616096497 0.1645004004240036",
        "64.3526611328125 6.822083950042725 -217.2699737548828 -0.49519839882850647 0.07839114964008331 0.8536311984062195 0.14123442769050598",
        "87.61502075195312 6.594196796417236 -215.63339233398438 -0.3816908597946167 0.04569240286946297 0.9095445871353149 0.15796545147895813",
        "93.6544189453125 2.685941457748413 -197.82374572753906 -0.16697746515274048 0.03893602266907692 0.9619251489639282 0.2128443866968155",
        "94.32459259033203 2.713803768157959 -170.810302734375 0.0032481353264302015 -0.0022102664224803448 0.9765967726707458 0.21504302322864532",
        "92.82249450683594 2.470503091812134 -146.094970703125 0.15542161464691162 -0.022394780069589615 0.964370846748352 0.21291232109069824",
        "85.52800750732422 3.0743143558502197 -130.8416290283203 0.4011482000350952 -0.09006363898515701 0.8878430128097534 0.20664863288402557",
        "80.02511596679688 2.6742751598358154 -149.04147338867188 0.5602836608886719 -0.12539739906787872 0.7944682240486145 0.19793424010276794",
        "77.05878448486328 -4.342080593109131 -161.8608856201172 0.5561851263046265 -0.14075957238674164 0.7750111222267151 0.26495763659477234",
        "79.36046600341797 -6.068016529083252 -147.27667236328125 0.4782457649707794 -0.15366490185260773 0.8162625432014465 0.28527799248695374",
        "84.34024810791016 0.5456506013870239 -123.81986236572266 0.47757571935653687 -0.13034167885780334 0.8464366793632507 0.19615665078163147",
        "81.51422119140625 2.0464251041412354 -100.28237915039062 0.4389341175556183 -0.0875725969672203 0.8790438175201416 0.1641639918088913",
        "71.96957397460938 -3.6681387424468994 -71.45342254638672 0.42264410853385925 -0.1273317188024521 0.8627907037734985 0.24647697806358337",
        "57.24648666381836 -10.050080299377441 -51.206947326660156 0.6059364080429077 -0.22226393222808838 0.723783552646637 0.2440842241048813",
        "45.64863967895508 -1.5954997539520264 -50.5411376953125 0.7393723726272583 -0.19492535293102264 0.6214097738265991 0.1708289086818695",
        "13.97993278503418 -1.6955177783966064 -50.67420196533203 0.7672116160392761 -0.22100143134593964 0.5852484107017517 0.14152391254901886",
        "-20.591642379760742 -9.389206886291504 -57.6645622253418 0.8284981846809387 -0.2887195646762848 0.4565328061580658 0.1476813107728958",
        "-35.276371002197266 -2.796156883239746 -62.761573791503906 0.926967442035675 -0.27543744444847107 0.24001529812812805 0.08519495278596878",
        "-9.61944580078125 3.4092161655426025 -63.14923858642578 0.9718039035797119 -0.23291371762752533 0.023254264146089554 0.02841993048787117",
        "-7.765168190002441 -14.016154289245605 -59.39951705932617 0.9153966307640076 -0.3827272951602936 0.1063842698931694 0.06520211696624756",
        "-34.62398147583008 -4.413326263427734 -51.11613464355469 0.9131514430046082 -0.2881343364715576 0.2818598449230194 0.06073123216629028",
        "-41.24602127075195 13.325603485107422 -46.185848236083984 0.9756863713264465 -0.13170376420021057 0.1744871884584427 0.015640972182154655",
        "-35.65807342529297 14.753942489624023 -41.391387939453125 0.9929333925247192 -0.11534794420003891 0.023397639393806458 0.015193709172308445",
        "-31.127246856689453 10.82556438446045 -37.12413024902344 0.9868279695510864 -0.1577606499195099 -0.03577554598450661 -0.001498666126281023",
        "-26.403486251831055 7.026432514190674 -35.84193420410156 0.9783209562301636 -0.19483210146427155 -0.06781837344169617 -0.018145041540265083",
        "-13.658088684082031 4.588315963745117 -39.67932891845703 0.9734839797019958 -0.21359263360500336 -0.07603635638952255 -0.030426666140556335",
        "4.644451141357422 4.121243000030518 -45.13253402709961 0.975565493106842 -0.21518412232398987 -0.041437674313783646 -0.015839815139770508",
        "20.045366287231445 4.336034297943115 -47.531776428222656 0.9767399430274963 -0.2077103704214096 -0.05028903856873512 -0.01751132681965828",
        "30.088176727294922 1.491904854774475 -53.325469970703125 0.9727627038955688 -0.22485068440437317 -0.054001666605472565 -0.01608392596244812",
        "46.67266082763672 0.8802167177200317 -67.21244812011719 0.9710031747817993 -0.23622861504554749 -0.032361067831516266 0.017366107553243637",
        "63.56309127807617 -0.38310834765434265 -75.6498794555664 0.9707544445991516 -0.23957866430282593 0.015366682782769203 0.0013728508492931724",
        "87.35689544677734 -4.07817268371582 -81.58409118652344 0.9382287859916687 -0.24687279760837555 0.23669344186782837 0.05250507965683937",
        "91.71146392822266 -6.501708984375 -86.8368911743164 0.8692753314971924 -0.24900265038013458 0.4134117662906647 0.10700000822544098",
        "83.64691925048828 -4.197187900543213 -107.65702819824219 0.7963775396347046 -0.19587399065494537 0.5453770756721497 0.17314764857292175",
        "81.38276672363281 12.099821090698242 -132.84202575683594 0.7548454403877258 -0.06032823771238327 0.6508813500404358 0.05406058207154274",
        "72.88864135742188 5.67198371887207 -150.2482147216797 0.6083175539970398 -0.09846382588148117 0.763754665851593 0.1921813040971756",
        "58.16261672973633 -3.808356523513794 -143.2674560546875 0.5118880867958069 -0.14268843829631805 0.8015831112861633 0.27399882674217224",
        "37.81783676147461 -7.18105411529541 -126.51510620117188 0.4443775713443756 -0.13837909698486328 0.8410988450050354 0.2755589187145233",
        "35.16533660888672 -9.786723136901855 -125.49325561523438 0.42354193329811096 -0.14161208271980286 0.843212902545929 0.2992496192455292",
        "50.12172317504883 -3.2964632511138916 -143.91226196289062 0.4455038607120514 -0.12891237437725067 0.8506613969802856 0.247554749250412",
        "70.60814666748047 -8.949055671691895 -171.68894958496094 0.4373845160007477 -0.13463890552520752 0.843921422958374 0.2799357771873474",
        "67.19137573242188 -10.412525177001953 -188.66329956054688 0.5075476765632629 -0.1744050234556198 0.7952749133110046 0.2819860577583313",
        "44.43366622924805 -9.283181190490723 -202.55322265625 0.47477272152900696 -0.11556600034236908 0.8145483136177063 0.3126441240310669",
        "25.650428771972656 -7.8961262702941895 -202.21827697753906 0.3395957946777344 -0.10131100565195084 0.8788480162620544 0.31943216919898987",
        "6.581155776977539 -8.909465789794922 -190.96031188964844 0.09639161825180054 -0.006957646459341049 0.9375188946723938 0.334243506193161",
        "1.6772717237472534 -5.976314067840576 -176.5522918701172 -0.05082572624087334 0.05913674086332321 0.9510186314582825 0.2991373836994171",
        "-11.475303649902344 -6.588889122009277 -172.35374450683594 -0.07839340716600418 0.04557117074728012 0.9447959661483765 0.3148624002933502",
        "-36.00679016113281 -12.272186279296875 -171.188232421875 -0.07259584218263626 0.06933245807886124 0.9211089015007019 0.37614014744758606",
        "-44.158748626708984 2.9162302017211914 -172.15708923339844 -0.08482315391302109 0.05959360674023628 0.9701172709465027 0.21937663853168488",
        "-32.1990966796875 6.80306339263916 -177.85035705566406 -0.28296777606010437 0.0753706619143486 0.9409790635108948 0.16972646117210388",
        "-27.756319046020508 2.3960790634155273 -180.89051818847656 -0.2967696487903595 0.07533299177885056 0.924094021320343 0.2286982536315918",
        "-30.946224212646484 2.291743755340576 -180.04443359375 -0.2426748126745224 0.06018000468611717 0.9412612915039062 0.22696806490421295",
        "-30.807485580444336 2.2729625701904297 -181.26463317871094 -0.23856276273727417 0.059769127517938614 0.9453942775726318 0.21388162672519684",
        "-31.190576553344727 -0.30461832880973816 -175.04588317871094 -0.2160712331533432 -0.005759756080806255 0.9207738041877747 0.324739545583725",
        "-23.871963500976562 -4.710440635681152 -167.7413787841797 -0.034704264253377914 0.11510007083415985 0.9822073578834534 0.14427869021892548",
        "-20.841670989990234 -4.535142421722412 -171.7575225830078 -0.2162102907896042 -0.017965026199817657 0.9311485290527344 0.29307499527931213",
        "-22.426939010620117 -1.8147408962249756 -176.43075561523438 -0.13463182747364044 0.05075014382600784 0.9413467645645142 0.3052295446395874",
        "-23.802560806274414 -0.7070631980895996 -176.5728759765625 -0.13620631396770477 0.05568455159664154 0.9525353908538818 0.2665024697780609",
        "-24.3045597076416 -0.8619622588157654 -175.91712951660156 -0.14902155101299286 0.037248644977808 0.9576546549797058 0.2435213327407837",
        "-23.732725143432617 -1.8713067770004272 -174.70155334472656 -0.10610289871692657 0.07336080819368362 0.9475156664848328 0.29253125190734863",
        "-24.53539276123047 -2.121094226837158 -175.4379119873047 -0.1531738042831421 0.03464546054601669 0.945756733417511 0.2843974232673645",
        "-26.004636764526367 -2.416569471359253 -176.62498474121094 -0.2272386997938156 -0.02175171487033367 0.9471464157104492 0.22539591789245605",
        "-23.968175888061523 -3.2374446392059326 -175.9307098388672 -0.145985946059227 0.026083366945385933 0.9392775893211365 0.3094600737094879",
        "-23.860458374023438 -2.6158928871154785 -177.16856384277344 -0.13505642116069794 0.027099763974547386 0.9440311193466187 0.29971757531166077",
        "-23.937740325927734 -1.9335944652557373 -177.29005432128906 -0.1345159113407135 0.02675798162817955 0.9424957633018494 0.3047805726528168",
        "-23.753097534179688 -2.1505377292633057 -177.2335968017578 -0.13589467108249664 0.031580954790115356 0.9429411888122559 0.3023197054862976",
        "-23.31983184814453 -2.1646480560302734 -177.11358642578125 -0.12944667041301727 0.04176319018006325 0.9421074390411377 0.3064851462841034",
        "-23.263303756713867 -2.4515626430511475 -176.85919189453125 -0.1122962236404419 0.05378976836800575 0.9477472901344299 0.29371994733810425",
        "-24.026731491088867 -1.4302433729171753 -176.92367553710938 -0.12659117579460144 0.029379624873399734 0.9451858401298523 0.2995586395263672",
        "-23.98265838623047 -3.108220100402832 -176.91856384277344 -0.28629738092422485 -0.03437886759638786 0.9385648369789124 0.1895999014377594",
        "-12.296745300292969 -4.859398365020752 -179.0918731689453 -0.17667242884635925 0.08427194505929947 0.9132837057113647 0.35720863938331604",
        "-1.1148771047592163 -5.029127597808838 -185.0550537109375 -0.20317544043064117 0.10767502337694168 0.9068222641944885 0.3532696068286896",
        "5.832645893096924 -4.187005996704102 -188.2733154296875 -0.24544213712215424 0.14168108999729156 0.8963052034378052 0.3410595655441284",
        "6.976543426513672 -5.0492939949035645 -188.75184631347656 -0.2659461498260498 0.1479356288909912 0.8941237926483154 0.3285274803638458",
        "3.2265312671661377 -5.231932163238525 -186.28012084960938 -0.25047653913497925 0.10957305133342743 0.9049987196922302 0.32593366503715515",
        "-2.9494452476501465 -3.823396682739258 -186.35549926757812 -0.30350369215011597 0.10853690654039383 0.887675404548645 0.3288431763648987",
        "-6.457633018493652 -3.5633034706115723 -187.4390869140625 -0.40021446347236633 0.10287591814994812 0.8570716381072998 0.30768993496894836",
        "-4.389503002166748 -5.254633903503418 -192.7224884033203 -0.4967716634273529 0.13017746806144714 0.7971867918968201 0.31743529438972473",
        "13.309450149536133 -8.885908126831055 -201.2056884765625 -0.5507963299751282 0.16968679428100586 0.7468026876449585 0.3318365514278412"];
    return {
        setOffsetScalar: function (v) {
            offset = Math.floor(v * data.length);
        },
        getAt: function (idx) {
            return data[(( (offset + idx) % data.length) + data.length) % data.length];
        }
    }
}
