import React, { useRef, useState } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import { colors } from "./theme";

const PAD_SIZE = 260;
const DOT_SIZE = 28;
const HIT_RADIUS = 40;

// Precompute the 9 dot centers in a 3x3 grid within PAD_SIZE.
const CENTERS = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const cx = PAD_SIZE * (0.2 + col * 0.3);
    const cy = PAD_SIZE * (0.2 + row * 0.3);
    CENTERS.push({ x: cx, y: cy });
  }
}

export default function PatternPad({ onComplete }) {
  const [sequence, setSequence] = useState([]);
  const seqRef = useRef([]);

  const updateSeq = (next) => {
    seqRef.current = next;
    setSequence([...next]);
  };

  // localX/localY are relative to the pad itself (via locationX/locationY,
  // which React Native computes for us — no manual screen-position
  // measuring needed, which was unreliable across devices).
  const tryAddDot = (localX, localY) => {
    for (let i = 0; i < CENTERS.length; i++) {
      if (seqRef.current.includes(i)) continue;
      const dx = localX - CENTERS[i].x;
      const dy = localY - CENTERS[i].y;
      if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
        updateSeq([...seqRef.current, i]);
        break;
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateSeq([]);
        const { locationX, locationY } = evt.nativeEvent;
        tryAddDot(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        tryAddDot(locationX, locationY);
      },
      onPanResponderRelease: () => {
        onComplete(seqRef.current.join("-"), seqRef.current.length);
      },
      onPanResponderTerminate: () => {
        onComplete(seqRef.current.join("-"), seqRef.current.length);
      },
    })
  ).current;

  return (
    <View style={styles.pad} {...panResponder.panHandlers}>
      {sequence.slice(1).map((idx, i) => {
        const from = CENTERS[sequence[i]];
        const to = CENTERS[idx];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={`line-${i}`}
            pointerEvents="none"
            style={[
              styles.line,
              {
                width: length,
                left: from.x,
                top: from.y - 2,
                transform: [{ translateY: -1 }, { rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
      {CENTERS.map((c, i) => {
        const active = sequence.includes(i);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.dot,
              {
                left: c.x - DOT_SIZE / 2,
                top: c.y - DOT_SIZE / 2,
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: PAD_SIZE,
    height: PAD_SIZE,
    alignSelf: "center",
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  line: {
    position: "absolute",
    height: 3,
    backgroundColor: colors.primary,
    transformOrigin: "left center",
  },
});
