"use client";

import Image from "next/image";
import React from "react";
import styles from "./PartnersMarquee.module.css";

const PARTNERS = [
  { name: "Gimbalabs", logo: "/gimbalabs.jpeg" },
  { name: "Andamio", logo: "/andamio.JPG" },
  { name: "45B", logo: "/45B.png" },
  { name: "Discover Cardano", logo: "/discover_cardano.JPG" },
];

export function PartnersMarquee() {
  // Duplicate the list of partners to ensure seamless loop
  const marqueeItems = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <section className={styles.marqueeSection} aria-label="Our Partners">
      <div className="container">
        <h3 className={styles.marqueeTitle}>Our Partners & Ecosystem Projects</h3>
        <div className={styles.marqueeWrapper}>
          <div className={styles.marqueeTrack}>
            {marqueeItems.map((partner, index) => (
              <div className={styles.partnerLogo} key={`${partner.name}-${index}`}>
                <div className={styles.logoContainer}>
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={140}
                    height={50}
                    className={styles.logoImg}
                    unoptimized
                  />
                </div>
                <span className={styles.partnerName}>{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
