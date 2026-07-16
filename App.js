import React, { useEffect, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, BackHandler } from "react-native";
import { initDb } from "./src/db";
import { colors } from "./src/theme";
import LockScreen from "./src/screens/LockScreen";
import SearchScreen from "./src/screens/SearchScreen";
import DetailScreen from "./src/screens/DetailScreen";
import RecordFormScreen from "./src/screens/RecordFormScreen";
import ChangeLockScreen from "./src/screens/ChangeLockScreen";

// Where the hardware/gesture back button should go from each screen.
// "search" is the root — back from there falls through to the OS (exits app).
const BACK_TARGET = {
  detail: "search",
  add: "search",
  edit: "detail",
  changeLock: "search",
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState("lock"); // lock | search | detail | add | edit | changeLock
  const [activeStayId, setActiveStayId] = useState(null);

  useEffect(() => {
    initDb().then(() => setReady(true));
  }, []);

  const goBack = useCallback(() => {
    const target = BACK_TARGET[screen];
    if (target) {
      setScreen(target);
      return true; // handled — don't exit the app
    }
    return false; // on "search" (or "lock") — let the OS handle it (exits app)
  }, [screen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => sub.remove();
  }, [goBack]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {screen === "lock" && <LockScreen onUnlock={() => setScreen("search")} />}

      {screen === "search" && (
        <SearchScreen
          onOpenDetail={(stayId) => {
            setActiveStayId(stayId);
            setScreen("detail");
          }}
          onGoAdd={() => setScreen("add")}
          onGoChangeLock={() => setScreen("changeLock")}
        />
      )}

      {screen === "detail" && (
        <DetailScreen
          stayId={activeStayId}
          onBack={() => setScreen("search")}
          onOpenDetail={(stayId) => setActiveStayId(stayId)}
          onEdit={(stayId) => {
            setActiveStayId(stayId);
            setScreen("edit");
          }}
        />
      )}

      {screen === "add" && (
        <RecordFormScreen
          mode="add"
          onBack={() => setScreen("search")}
          onSaved={() => setScreen("search")}
        />
      )}

      {screen === "edit" && (
        <RecordFormScreen
          mode="edit"
          stayId={activeStayId}
          onBack={() => setScreen("detail")}
          onSaved={() => setScreen("detail")}
        />
      )}

      {screen === "changeLock" && (
        <ChangeLockScreen onBack={() => setScreen("search")} />
      )}
    </>
  );
}
