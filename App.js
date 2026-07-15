import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { initDb } from "./src/db";
import { colors } from "./src/theme";
import LockScreen from "./src/screens/LockScreen";
import SearchScreen from "./src/screens/SearchScreen";
import DetailScreen from "./src/screens/DetailScreen";
import AddScreen from "./src/screens/AddScreen";
import ChangeLockScreen from "./src/screens/ChangeLockScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState("lock"); // lock | search | detail | add | changeLock
  const [activeStayId, setActiveStayId] = useState(null);

  useEffect(() => {
    initDb().then(() => setReady(true));
  }, []);

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
        <DetailScreen stayId={activeStayId} onBack={() => setScreen("search")} />
      )}

      {screen === "add" && (
        <AddScreen onBack={() => setScreen("search")} onSaved={() => setScreen("search")} />
      )}

      {screen === "changeLock" && (
        <ChangeLockScreen onBack={() => setScreen("search")} />
      )}
    </>
  );
}
