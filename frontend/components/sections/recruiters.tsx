'use client';

import ProfileCard from "../custom/profile-card";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchRecruiters } from "@/store/reducers/recruiterSlice";
import { useAuth } from "@/context/AuthContext";

const ITEM_GAP = 8;
const AUTO_SCROLL_INTERVAL = 3000;

const Recruiters = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const { items } = useAppSelector((state) => state.recruiters);

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
    dispatch(fetchRecruiters());
  }, [dispatch]);

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
    <div className="bg-white rounded-lg px-2 py-1 w-full relative" 
         style={{ 
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 8px 0 15px -3px rgba(0, 0, 0, 0.1), 8px 0 6px -2px rgba(0, 0, 0, 0.05)' 
         }}>
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold">Top Recruiters</h3>
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
            {filteredRecruiters.map((recruiter, index) => (
              <div
                key={recruiter._id}
                ref={index === 0 ? itemRef : null} // Use first item to measure width
              >
                <ProfileCard
                  title={recruiter.companyName}
                  subtitle={`${recruiter.positions.length} open positions`}
                  country={recruiter.country}
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

export default Recruiters;