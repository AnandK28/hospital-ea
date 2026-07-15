import React, { useRef, useState } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import { colors } from "./theme";

const PAD_SIZE = 260;
const DOT_SIZE = 26;
const HIT_RADIUS = 34;

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
  const containerRef = useRef(null);
  const originRef = useRef({ x: 0, y: 0 });

  const updateSeq = (next) => {
    seqRef.current = next;
    setSequence([...next]);
  };

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
        const { pageX, pageY } = evt.nativeEvent;
        tryAddDot(pageX - originRef.current.x, pageY - originRef.current.y);
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        tryAddDot(pageX - originRef.current.x, pageY - originRef.current.y);
      },
      onPanResponderRelease: () => {
        onComplete(seqRef.current.join("-"), seqRef.current.length);
      },
    })
  ).current;

  return (
    <View
      ref={containerRef}
      style={styles.pad}
      onLayout={() => {
        containerRef.current?.measure((x, y, w, h, pageX, pageY) => {
          originRef.current = { x: pageX, y: pageY };
        });
      }}
      {...panResponder.panHandlers}
    >
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
});
