// @input SceneObject mainCamera;
// @input Asset.ConnectedLensModule connectedLensModule
// @input Component.ColocatedTrackingComponent colocatedTrackingComponent
// @input Component.DeviceTracking deviceTrackingComponent

const utils = global.utils;

var log = utils.makeLogger("ColocatedController: ");

script.colocatedTrackingComponent.enabled = false;
script.deviceTrackingComponent.enabled = true;

// create a global reference to this
global.connectedController = script;

//------------------------------
// States for ColocatedBehaviour
//------------------------------

// These are the distinct ui states
const FlowState = {
  // Initial state
  NOT_SET: "not set",
  SESSION_TYPE_SELECT: "session type select",
  // Build a map of a room
  PROMPT_TO_CREATE_COLOCATED: "prompt to create colocated",
  CREATING_COLOCATED: "creating colocated",
  UPLOADING_COLOCATED: "uploading colocated",
  DOWNLOADING_COLOCATED: "downloading colocated",
  COLOCATED_CREATED_SNAPCODE: "colocated created snapcode",
  SNAPCODE_USED: "snapcode used",
  INITIATOR_WAITING_FOR_TRACKING: "initiator waiting for tracking",
  JOINER_WAITING_FOR_TRACKING: "joiner waiting for tracking",
  // Eroor
  ERRORED: "error",
  // Finished or joined a session
  DONE: "done",
  RESHOW_SNAPCODE: "reshow snapcode",
};

const SessionType = {
  NOT_SET: "not set",
  REMOTE: "remote",
  COLOCATED: "colocated",
};

const EventType = {
  STATE_CHANGE: "state change",
  MESSAGE_RECEIVED: "message received",
  USER_JOINED_SESSION: "user joined session",
  USER_LEFT_SESSION: "user left session",
  SNAPCODE_TEXTURE: "snapcode texture",
  BUILDING_PROGRESS_UPDATE: "building progress update",
  CONNECTED: "connected",
  DISCONNECTED: "on disconnected",
  CONNECTED_LENS_ERROR: "on connected lens error",
};

// This is the application state that is changing over time
const colocateState = {
  flowState: FlowState.NOT_SET,
  mapBuildingProgress: 0,
  errorMessage: "",
  snapCodeTexture: null,
  sessionType: SessionType.NOT_SET,
  multiplayerSession: null,
  hasJoined: false,
  userId: "",
};

//----------------
// State & actions
//----------------

var actions = (function (initialState) {
  var currentState = initialState;
  const events = new utils.Events();

  var setState = function (change) {
    var nextState = Object.assign({}, currentState, change);
    if (!utils.areEqualShallow(nextState, currentState)) {
      var previousState = currentState;
      currentState = nextState;
      events.trigger(EventType.STATE_CHANGE, nextState, previousState);
    }
  };

  return {
    setFlowState: function (uiFlowState) {
      log("FlowState now:", uiFlowState);
      setState({ flowState: uiFlowState });
    },
    setBuildingProgress: function (mapBuildingProgress) {
      setState({ mapBuildingProgress: mapBuildingProgress });
    },
    setErrorMessage: function (errorMessage) {
      setState({ errorMessage: "" + errorMessage });
    },
    setSnapCodeTexture: function (snapCodeTexture) {
      setState({ snapCodeTexture: snapCodeTexture });
    },
    setSessionType: function (sessionType) {
      setState({ sessionType: sessionType });
    },
    setMultiplayerSession: function (multiplayerSession) {
      setState({ multiplayerSession: multiplayerSession });
    },
    setHasJoined: function (hasJoined) {
      setState({ hasJoined: hasJoined });
    },
    setUserId: function (userId) {
      setState({ userId: userId });
    },
    getCurrentState: function () {
      return currentState;
    },
    waitForFlowStateTransition: function (fromFlowState, toFlowState) {
      return new utils.Promise(function (resolve, reject) {
        var handleStateChange = function (nextState, previousState) {
          if (nextState.flowState !== previousState.flowState) {
            events.off(EventType.STATE_CHANGE, handleStateChange);
            if (
              fromFlowState === previousState.flowState &&
              toFlowState === currentState.flowState
            ) {
              resolve();
            } else {
              reject();
            }
          }
        };
        events.on(EventType.STATE_CHANGE, handleStateChange);
      });
    },
    onStateChange: function (fn) {
      events.on(EventType.STATE_CHANGE, fn);
    },
    offStateChange: function (fn) {
      events.off(EventType.STATE_CHANGE, fn);
    },
  };
})(colocateState);

//---------------
// Connected Lens
//---------------

// Initialises a connected lens module and exposes
// with an object alongside with some convenience functions
// TODO: Return an object like colocated
function makeConnected() {
  var connectedLensModule;
  var multiplayerSession;
  var isJoiningSession = false;

  // Create an events system for broadcasting snapcode
  var events = new utils.Events();
  // Bridge action state changes
  actions.onStateChange(function (state) {
    events.trigger(EventType.STATE_CHANGE, state);
  });

  var connected = {
    connect: function () {
      return new utils.Promise(function (resolve, reject) {
        connectedLensModule = script.connectedLensModule;

        // Create the session with options (these are initial callbacks)
        var options = ConnectedLensSessionOptions.create();

        // On Session Created
        options.onSessionCreated = function (session, sessionJoinType) {
          log(
            "Session created with a sessionJoinType of: ",
            sessionJoinType
          );
          isJoiningSession =
            sessionJoinType ===
            ConnectedLensSessionOptions.SessionCreationType
              .MultiplayerReceiver;
        };

        var getLocalUserIdOnce = utils.once(function (
          session,
          onComplete
        ) {
          session.getLocalUserId(onComplete);
        });

        // On Connected (This may be called multiple times like after inviting people a new session will be connected )
        options.onConnected = function (session) {
          multiplayerSession = session;
          log("Session now connected");
          getLocalUserIdOnce(session, function (userId) {
            log("My own user ID is", userId);
            actions.setUserId(userId);
            userId = userId;
            resolve();
          });
          // Store the session type if we have one
          var sessionType = actions.getCurrentState().sessionType;
          if (sessionType !== SessionType.NOT_SET) {
            connected.storeSessionType(sessionType);
          }
          events.trigger(EventType.CONNECTED, session);
        };

        options.onError = function (session, code, message) {
          if (message === "LensStudioConnectionError") {
            log(
              "Warning: LensStudio can't connect to connectedLens sessions itself. Pretending the session was connected but the session will be null."
            );
            resolve();
          } else if (code === "MatchJoinRestrictedToFriendOnly") {
            reject("Can’t join. You are not friends with this user");
          } else {
            log("Connected lens on error", code, message);
            reject(message);
            events.trigger(
              EventType.CONNECTED_LENS_ERROR,
              code,
              message
            );
          }
        };

        // On message
        options.onMessageReceived = function (
          session,
          userId,
          message
        ) {
          events.trigger(EventType.MESSAGE_RECEIVED, userId, message);
        };

        options.onUserJoinedSession = function (session, userInfo) {
          events.trigger(EventType.USER_JOINED_SESSION, userInfo);
        };

        options.onUserLeftSession = function (session, userInfo) {
          events.trigger(EventType.USER_LEFT_SESSION, userInfo);
        };

        options.onDisconnected = function (session, disconnectInfo) {
          events.trigger(EventType.DISCONNECTED, disconnectInfo);
        };

        connectedLensModule.createSession(options);
      });
    },
    onSnapCodeTexture: function (fn) {
      events.on(EventType.SNAPCODE_TEXTURE, fn);
    },
    offSnapCodeTexture: function (fn) {
      events.off(EventType.SNAPCODE_TEXTURE, fn);
    },
    requestSnapCode: function () {
      log("Requesting a snap code");
      connectedLensModule.shareSession(
        ConnectedLensModule.SessionShareType.Snapcode,
        function (session, snapcodeTexture) {
          log("Received a snapcode texture");
          events.trigger(EventType.SNAPCODE_TEXTURE, snapcodeTexture);
        }
      );
    },
    getEvents: function () {
      return events;
    },
    getIsJoiningSession: function () {
      return isJoiningSession;
    },
    getConnectedLensModule: function () {
      return connectedLensModule;
    },
    getMultiplayerSession: function () {
      return multiplayerSession;
    },
    storeSessionType: function (sessionType) {
      var storageOptions = StorageOptions.create();
      storageOptions.scope = StorageScope.Session;
      if (
        multiplayerSession &&
        typeof multiplayerSession.setStoredValue === "function"
      ) {
        multiplayerSession.setStoredValue(
          "connected-lens-session-type",
          sessionType,
          storageOptions,
          function () {
            log(
              "Successfully set session storage to session type:",
              sessionType
            );
          },
          function (error, description) {
            log(
              "Failed to set session storage to session type: " +
                error +
                ", " +
                description
            );
          }
        );
      }
    },
    requestSessionType: function () {
      return new utils.Promise(function (resolve, reject) {
        multiplayerSession.getStoredValue(
          "connected-lens-session-type",
          StorageScope.Session,
          function (key, value) {
            resolve(value);
          },
          function (error, description) {
            log(
              "Error retrieving storage session type:",
              error,
              ",",
              description,
              "Will start remote"
            );
            resolve(SessionType.REMOTE);
          }
        );
      });
    },
  };

  return connected;
}

//----------
// Colocated
//----------

function makeColocated() {
  var component = script.colocatedTrackingComponent;
  component.autoEnableWhenTracking = false;
  component.enabled = true;

  // Create an events system for broadcasting build progress
  var events = new utils.Events();

  var updateEvent = script.createEvent("UpdateEvent");
  var lastBuildingProgress = 0;
  updateEvent.bind(function () {
    var hasBuildingProgress = false;
    if (typeof component.getBuildingProgress !== "undefined") {
      latestBuildingProgress = component.getBuildingProgress();
      hasBuildingProgress = true;
    }

    if (typeof component.buildingProgress !== "undefined") {
      latestBuildingProgress = component.buildingProgress;
      hasBuildingProgress = true;
    }

    if (
      hasBuildingProgress &&
      latestBuildingProgress !== lastBuildingProgress
    ) {
      lastBuildingProgress = latestBuildingProgress;
      events.trigger(
        EventType.BUILDING_PROGRESS_UPDATE,
        lastBuildingProgress
      );
    }
  });

  return {
    onBuildingProgressUpdate: function (fn) {
      events.on(EventType.BUILDING_PROGRESS_UPDATE, fn);
    },
    offBuildingProgressUpdate: function (fn) {
      events.off(EventType.BUILDING_PROGRESS_UPDATE, fn);
    },
    build: function (session) {
      return new utils.Promise(function (resolve, reject) {
        if (!component.canBuild) {
          // This could be triggered if the front camera is active
          return reject(
            "Sorry, your device does not support shared AR experiences."
          );
        }
        component.onTrackingAvailable.add(resolve);
        component.onBuildFailed.add(function (error) {
          log("Map building failed", error);
          return reject("Failed to create a shared area");
        });
        log("Starting to build a shared AR experience");
        component.startBuilding(session || null);
      });
    },
    join: function (session) {
      return new utils.Promise(function (resolve, reject) {
        if (!component.canBuild) {
          // This could be triggered if the front camera is active
          return reject(
            "Sorry, your device does not support shared AR experiences."
          );
        }
        log("Attempting to join build a shared AR experience");
        var updateEvent = script.createEvent("UpdateEvent");
        updateEvent.bind(function () {
          if (component.canTrack) {
            script.removeEvent(updateEvent);
            resolve();
          }
        });
        component.onJoinFailed.add(reject);
        component.join(session);
      });
    },
    getIsTracking: function () {
      return component.isTracking;
    },
    waitForTracking: function () {
      return new utils.Promise(function (resolve, reject) {
        var updateEvent = script.createEvent("UpdateEvent");
        updateEvent.bind(function () {
          if (component.isTracking) {
            script.removeEvent(updateEvent);
            resolve();
          }
        });
      });
    },
  };
}

//-----------------
// Initialise logic
//-----------------

// Make a connected object
var connected = makeConnected();
connected.onSnapCodeTexture(actions.setSnapCodeTexture);

// Store the create session connected lens promise incase
// we try to do something with it before it has resolved
var waitingForConnectedSessionPromise;

// Right away when the app opens, create a colocated session to see if we are
// joining a session or not.
script.createEvent("ConnectedLensEnteredEvent").bind(function () {
  log("Creating a connected lens session");
  // Create a connected lens session
  waitingForConnectedSessionPromise = connected
    .connect()
    .then(function () {
      waitingForConnectedSessionPromise = null;
      if (connected.getIsJoiningSession()) {
        actions.setHasJoined(true);
        log("Joining session");
        connected
          .requestSessionType()
          .then(function (value) {
            if (value === SessionType.COLOCATED) {
              actions.setSessionType(SessionType.COLOCATED);
              actions.setFlowState(FlowState.DOWNLOADING_COLOCATED);
              var colocated = makeColocated();
              colocated
                .join(connected.getMultiplayerSession())
                .then(function () {
                  if (colocated.getIsTracking()) {
                    setDone();
                  } else {
                    actions.setFlowState(
                      FlowState.JOINER_WAITING_FOR_TRACKING
                    );
                    colocated.waitForTracking().then(setDone);
                  }
                  function setDone() {
                    actions.setFlowState(FlowState.DONE);
                    script.deviceTrackingComponent.enabled = false;
                  }
                })
                .catch(function (message) {
                  log(
                    "Failed to join a colocated connected lens session: " +
                      message
                  );
                  actions.setFlowState(FlowState.ERRORED);
                  actions.setErrorMessage(
                    typeof message !== "undefined"
                      ? "Failed to join shared AR experience: " +
                          message
                      : "Failed to join shared AR experience."
                  );
                });
            } else if (value === SessionType.REMOTE) {
              script.deviceTrackingComponent.enabled = true;
              actions.setMultiplayerSession(
                connected.getMultiplayerSession()
              );
              actions.setSessionType(SessionType.REMOTE);
              actions.setFlowState(FlowState.DONE);
            } else {
              actions.setFlowState(FlowState.ERRORED);
              actions.setErrorMessage(
                "Unknown session type of: " + value
              );
            }
          })
          .catch(function (message) {
            actions.setFlowState(FlowState.ERRORED);
            actions.setErrorMessage(message);
          });
      } else {
        log("Initiating session");
        actions.setHasJoined(false);
        actions.setFlowState(FlowState.SESSION_TYPE_SELECT);
        actions.setMultiplayerSession(
          connected.getMultiplayerSession()
        );
      }
    })
    .catch(function (message) {
      log("Failed to create a shared AR session: " + message);
      actions.setFlowState(FlowState.ERRORED);
      if (typeof message !== "undefined") {
        actions.setErrorMessage("" + message);
      }
    });
});

//================================================
// API
//================================================

// Types
// -----
script.api.FlowState = FlowState;
script.api.SessionType = SessionType;
script.api.EventType = EventType;

// Events
// ------
script.api.events = connected.getEvents();

// Behaviours
// ----------

// State changes for ColocatedBehaviours
script.api.onStateChange = function (fn) {
  // Trigger the state for the listener
  utils.delay0(function () {
    fn(actions.getCurrentState());
  });
  // Subscribe them to state changes
  connected.getEvents().on(EventType.STATE_CHANGE, fn);
};
script.api.offStateChange = function (fn) {
  connected.getEvents().off(EventType.STATE_CHANGE, fn);
};

script.api.getState = function () {
  return actions.getCurrentState();
};

// Communication
// -------------

// Send messages
var warnAttemptingToSendBeforeConnection = utils.once(function () {
  log("Messages will not send before the session is connected");
});

script.api.sendStringMessage = function (message) {
  var multiplayerSession = connected.getMultiplayerSession();
  if (!multiplayerSession) {
    warnAttemptingToSendBeforeConnection();
  } else {
    multiplayerSession.sendMessageWithTimeout(message, -1);
  }
};

script.api.hasConnected = function () {
  return !!connected.getMultiplayerSession();
};

// UI Requests
// -----------

// Jump right into the session without
// building a map. Later people could
// be added to the session
script.api.startSolo = function () {
  script.deviceTrackingComponent.enabled = true;
  actions.setFlowState(FlowState.DONE);
};

// Start a colocated session & map building
script.api.startColocated = function () {
  actions.setFlowState(FlowState.PROMPT_TO_CREATE_COLOCATED);
  actions
    .waitForFlowStateTransition(
      FlowState.PROMPT_TO_CREATE_COLOCATED,
      FlowState.CREATING_COLOCATED
    )
    .then(function () {
      if (waitingForConnectedSessionPromise) {
        log(
          "User want to create a map, but are waiting for a session. Will keep waiting for the session."
        );
        waitingForConnectedSessionPromise.then(createMap);
      } else {
        createMap();
      }

      function createMap() {
        // set the session to be a type a colocated session
        actions.setSessionType(SessionType.COLOCATED);
        connected.storeSessionType(SessionType.COLOCATED);
        connected.requestSnapCode();

        log("Starting to build a colocated map");
        var colocated = makeColocated();
        colocated.onBuildingProgressUpdate(actions.setBuildingProgress);

        // Check for uploading complete
        function waitForBuildingComplete(progress) {
          if (progress >= 1) {
            log("Build progress has reached 1");
            colocated.offBuildingProgressUpdate(
              waitForBuildingComplete
            );
            if (
              actions.getCurrentState().flowState ===
              FlowState.CREATING_COLOCATED
            ) {
              log("Will set state to uploading colocated");
              actions.setFlowState(FlowState.UPLOADING_COLOCATED);
            } else {
              log(
                "Warning building is complete, but flowstate is not creating colocated"
              );
            }
          }
        }
        colocated.onBuildingProgressUpdate(waitForBuildingComplete);

        // Start builiding
        colocated
          .build(connected.getMultiplayerSession())
          .then(function () {
            log("Finished building a connected session");
            if (actions.getCurrentState().snapCodeTexture === null) {
              if (connected.getMultiplayerSession()) {
                actions.setFlowState(FlowState.ERRORED);
                actions.setErrorMessage(
                  "A snapcode has not been generated"
                );
              } else {
                // Lens Studio Preview behaviour
                log(
                  "I am running in Lens Studio Preview, I don't need a Snapcode"
                );
                actions.setFlowState(
                  FlowState.COLOCATED_CREATED_SNAPCODE
                );
              }
            } else {
              actions.setFlowState(
                FlowState.COLOCATED_CREATED_SNAPCODE
              );
            }
            actions
              .waitForFlowStateTransition(
                FlowState.COLOCATED_CREATED_SNAPCODE,
                FlowState.SNAPCODE_USED
              )
              .then(function () {
                if (colocated.getIsTracking()) {
                  setDone();
                } else {
                  actions.setFlowState(
                    FlowState.INITIATOR_WAITING_FOR_TRACKING
                  );
                  colocated.waitForTracking().then(setDone);
                }
                function setDone() {
                  actions.setFlowState(FlowState.DONE);
                  script.deviceTrackingComponent.enabled = false;
                }
              });
          })
          .catch(function (message) {
            actions.setFlowState(FlowState.ERRORED);
            actions.setErrorMessage(message);
          });
      }
    })
    .catch(function (message) {
      var errorString =
        "Error at state: " +
        actions.getCurrentState().flowState +
        ". Error message: " +
        message;
      log(errorString);
      actions.setErrorMessage("" + errorString);
      actions.setFlowState(FlowState.ERRORED);
    });
};

// Confirm user has read the instructions and
// is ready to start building a map
script.api.doConfirmStartBulding = function () {
  if (
    actions.getCurrentState().flowState ===
    FlowState.PROMPT_TO_CREATE_COLOCATED
  ) {
    actions.setFlowState(FlowState.CREATING_COLOCATED);
  } else {
    log(
      "Something has asked to confirm building, but the UI is in the wrong state"
    );
  }
};

// Confirm the user has finished with the snapcode
script.api.doConfirmSnapcodeUsed = function () {
  if (
    actions.getCurrentState().flowState ===
    FlowState.COLOCATED_CREATED_SNAPCODE
  ) {
    actions.setFlowState(FlowState.SNAPCODE_USED);
  } else if (
    actions.getCurrentState().flowState === FlowState.RESHOW_SNAPCODE
  ) {
    actions.setFlowState(FlowState.DONE);
  } else {
    log(
      "Something has asked to confirm the snapcode display is done with, but the UI is in the wrong state"
    );
  }
};

// Start a remote session
script.api.startRemote = function () {
  script.deviceTrackingComponent.enabled = true;
  if (
    connected &&
    typeof connected.getConnectedLensModule().shareSession ===
      "function"
  ) {
    actions.setSessionType(SessionType.REMOTE);
    connected.storeSessionType(SessionType.REMOTE);
    connected
      .getConnectedLensModule()
      .shareSession(
        ConnectedLensModule.SessionShareType.Invitation,
        function () {}
      );
    // After a second, trigger DONE. This means if user dismissed the invite
    // screen they will enter the game
    var delayEvent = script.createEvent("DelayedCallbackEvent");
    delayEvent.bind(function () {
      actions.setFlowState(FlowState.DONE);
    });
    delayEvent.reset(1);
  }
};

// Reshow snapcode
script.api.doReshowSnapCode = function () {
  actions.setFlowState(FlowState.RESHOW_SNAPCODE);
};

// Get the session
script.api.getConnected = function () {
  return connected;
};
