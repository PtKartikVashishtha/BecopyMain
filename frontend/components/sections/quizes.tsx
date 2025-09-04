'use client';

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import ProfileCard from "../custom/profile-card";
import { useAuth } from "@/context/AuthContext";

interface Scorer {
  id: string;
  name: string;
  score: number;
  country: string;
}

const items: Scorer[] = [
  { id: "1", name: "Justin Owens", score: 0, country: "UK" },
  { id: "2", name: "William John", score: 0, country: "UK" },
  { id: "3", name: "James Anderson", score: 0, country: "US" },
  { id: "4", name: "Michael Roberts", score: 0, country: "AU" },
  { id: "5", name: "David Smith", score: 0, country: "Europe" },
  { id: "6", name: "David Smith", score: 0, country: "Europe" },
];

const CARD_WIDTH = 176; // Tailwind w-44
const GAP = 25;
const ITEM_WIDTH = CARD_WIDTH + GAP;
const ITEM_GAP = 8;
const AUTO_SCROLL_INTERVAL = 3000;


const Quizes = () => {
  const { isAuthenticated, user } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const [itemWidth, setItemWidth] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const controls = useAnimation();



  useEffect(() => {
    if (isAuthenticated && user?.country) {
      setSelectedCountry(user.country);
    }
  }, [isAuthenticated, user]);

  const countries = useMemo(() => {
    return ["all", ...Array.from(new Set(items.map((r) => r.country)))];
  }, [items]);

  const filteredRecruiters = useMemo(() => {
    return selectedCountry === "all"
      ? items
      : items.filter((r) => r.country === selectedCountry);
  }, [items, selectedCountry]);

  // Measure overflow and item width
  useEffect(() => {
    const checkOverflow = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const itemEl = itemRef.current;
      if (!itemEl || filteredRecruiters.length === 0) return;

      const singleItemWidth = itemEl.offsetWidth + ITEM_GAP;
      setItemWidth(singleItemWidth);

      const contentWidth = singleItemWidth * filteredRecruiters.length;
      setShouldAutoScroll(contentWidth > containerWidth);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [filteredRecruiters]);

  // Auto-scroll only if content overflows
  useEffect(() => {
    if (!shouldAutoScroll || itemWidth === 0) return;

    autoScrollRef.current = setInterval(() => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const contentWidth = itemWidth * filteredRecruiters.length;
      const maxScroll = contentWidth - containerWidth;

      const newOffset = offsetX - itemWidth;

      if (Math.abs(newOffset) >= maxScroll) {
        setOffsetX(0);
        controls.start({ x: 0, transition: { duration: 0.5 } });
      } else {
        setOffsetX(newOffset);
        controls.start({ x: newOffset, transition: { duration: 0.5 } });
      }
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [shouldAutoScroll, itemWidth, filteredRecruiters.length, offsetX, controls]);

    useEffect(() => {
      // Reset scroll when country filter changes
      setOffsetX(0);
      controls.start({ x: 0, transition: { duration: 0.3 } });
    }, [selectedCountry, controls]);

  return (
    <div className="bg-white rounded-lg px-2 py-1 w-full relative">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold">Top Quiz Rankers</h3>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="px-3 text-sm rounded-md border outline-none"
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country === "all" ? "All Countries" : country}
            </option>
          ))}
        </select>
      </div>

      <div ref={containerRef} className="relative w-full overflow-hidden">
        <motion.div
          animate={controls}
          className="flex gap-2 cursor-grab active:cursor-grabbing"
        >
          <div ref={scrollRef} className="flex gap-2 min-w-max">
            {filteredRecruiters.map((scorer, index) => (
              <div
                key={scorer.id}
                ref={index === 0 ? itemRef : null} // Use first item to measure width
              >
                <ProfileCard
                  title={scorer.name}
                  subtitle={`${scorer.score} rank`}
                  country={scorer.country}
                  image={""}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Quizes;