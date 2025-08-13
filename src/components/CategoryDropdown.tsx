'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  name: string;
  id?: string;
  children: Category[];
}

interface CategoryDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

// Static categories data - directly embedded for deployment reliability
const categories: Category[] = [
  {
    "name": "Safety",
    "id": "312780",
    "children": [
      {
        "name": "Traffic Safety",
        "id": "312794",
        "children": [
          {
            "name": "Traffic Signs and Stands",
            "id": "312906",
            "children": []
          },
          {
            "name": "Traffic Cones",
            "id": "313343",
            "children": []
          },
          {
            "name": "Traffic Delineators",
            "id": "395907",
            "children": []
          }
        ]
      },
      {
        "name": "Spill Kits and Hazmat Cleanup",
        "id": "312800",
        "children": [
          {
            "name": "Spill Kits",
            "id": "312913",
            "children": []
          }
        ]
      },
      {
        "name": "Fall Protection",
        "id": "312812",
        "children": [
          {
            "name": "Anchor Points and Connectors",
            "id": "312928",
            "children": []
          },
          {
            "name": "Harnesses",
            "id": "313080",
            "children": []
          },
          {
            "name": "Fall Protection Kits",
            "id": "313081",
            "children": []
          },
          {
            "name": "Carabiners",
            "id": "313082",
            "children": []
          },
          {
            "name": "Debris Netting",
            "id": "313084",
            "children": []
          },
          {
            "name": "Guardrail Systems",
            "id": "313130",
            "children": []
          },
          {
            "name": "Lifelines",
            "id": "374167",
            "children": []
          },
          {
            "name": "Positioning Lanyards",
            "id": "374168",
            "children": []
          },
          {
            "name": "Rope Grabs",
            "id": "374169",
            "children": []
          },
          {
            "name": "Shock Absorbing Lanyards",
            "id": "374170",
            "children": []
          },
          {
            "name": "Tool Lanyards",
            "id": "374171",
            "children": []
          }
        ]
      },
      {
        "name": "First Aid",
        "id": "312822",
        "children": [
          {
            "name": "Eyewash Stations",
            "id": "313079",
            "children": []
          },
          {
            "name": "First Aid Kits and Cabinets",
            "id": "313099",
            "children": []
          },
          {
            "name": "Defibrillators and Accessories",
            "id": "395953",
            "children": []
          },
          {
            "name": "Stretchers and Accessories",
            "id": "395956",
            "children": []
          }
        ]
      },
      {
        "name": "Coveralls and Workwear",
        "id": "312829",
        "children": [
          {
            "name": "Coveralls",
            "id": "313032",
            "children": []
          },
          {
            "name": "Welding Protection",
            "id": "374198",
            "children": []
          },
          {
            "name": "Winter Hats and Headliners",
            "id": "374199",
            "children": []
          }
        ]
      },
      {
        "name": "Padlocks, Cable Locks and Lockout Stations",
        "id": "312836",
        "children": [
          {
            "name": "Cable Locks",
            "id": "312972",
            "children": []
          },
          {
            "name": "Lockout Hasps",
            "id": "313003",
            "children": []
          },
          {
            "name": "Padlocks",
            "id": "313175",
            "children": []
          }
        ]
      },
      {
        "name": "Safety Fencing and Barriers",
        "id": "312841",
        "children": [
          {
            "name": "Caution and Barrier Tapes",
            "id": "312979",
            "children": []
          },
          {
            "name": "Underground Tapes",
            "id": "313046",
            "children": []
          },
          {
            "name": "Safety Fencing",
            "id": "313085",
            "children": []
          },
          {
            "name": "Pennant Flags",
            "id": "313210",
            "children": []
          }
        ]
      },
      {
        "name": "Hydration and Heat Stress Prevention",
        "id": "312855",
        "children": [
          {
            "name": "Coolers and Accessories",
            "id": "313025",
            "children": []
          },
          {
            "name": "Beverages and Drink Mixes",
            "id": "313070",
            "children": []
          },
          {
            "name": "Utility Tents and Canopies",
            "id": "313350",
            "children": []
          },
          {
            "name": "Cooling Bandanas, Head Wraps, and Hats",
            "id": "374195",
            "children": []
          },
          {
            "name": "Cups and Water Bottles",
            "id": "374196",
            "children": []
          }
        ]
      },
      {
        "name": "Fire Prevention",
        "id": "312871",
        "children": [
          {
            "name": "Fire Extinguishers and Accessories",
            "id": "313088",
            "children": []
          }
        ]
      },
      {
        "name": "Footwear and Foot Protection",
        "id": "312954",
        "children": [
          {
            "name": "Disposable Boot and Shoe Covers",
            "id": "374172",
            "children": []
          },
          {
            "name": "Rubber and PVC Boots",
            "id": "374173",
            "children": []
          }
        ]
      },
      {
        "name": "Gloves",
        "id": "313047",
        "children": [
          {
            "name": "Chemical-Resistant Gloves",
            "id": "374176",
            "children": []
          },
          {
            "name": "Cold-Weather Gloves",
            "id": "374177",
            "children": []
          },
          {
            "name": "Cut-Resistant Gloves",
            "id": "374178",
            "children": []
          },
          {
            "name": "Dipped Gloves",
            "id": "374179",
            "children": []
          },
          {
            "name": "Disposable Gloves",
            "id": "374180",
            "children": []
          },
          {
            "name": "Knit Gloves",
            "id": "374181",
            "children": []
          },
          {
            "name": "Leather Gloves",
            "id": "374182",
            "children": []
          }
        ]
      },
      {
        "name": "Hard Hats and Accessories",
        "id": "313138",
        "children": [
          {
            "name": "Hard Hat Accessories",
            "id": "374183",
            "children": []
          },
          {
            "name": "Hard Hats",
            "id": "374184",
            "children": []
          }
        ]
      },
      {
        "name": "Hearing Protection",
        "id": "313140",
        "children": [
          {
            "name": "Ear Muffs",
            "id": "374185",
            "children": []
          },
          {
            "name": "Earplugs",
            "id": "374186",
            "children": []
          }
        ]
      },
      {
        "name": "High-Vis Apparel",
        "id": "313143",
        "children": [
          {
            "name": "Go To Work Kits",
            "id": "374187",
            "children": []
          },
          {
            "name": "High-Vis Hats",
            "id": "374188",
            "children": []
          },
          {
            "name": "High-Vis Jackets",
            "id": "374189",
            "children": []
          },
          {
            "name": "High-Vis Shirts",
            "id": "374190",
            "children": []
          },
          {
            "name": "Rain Jackets",
            "id": "374191",
            "children": []
          },
          {
            "name": "Rain Pants",
            "id": "374192",
            "children": []
          },
          {
            "name": "Rain Suits",
            "id": "374193",
            "children": []
          },
          {
            "name": "Safety Vests",
            "id": "374194",
            "children": []
          },
          {
            "name": "High-Vis Pants",
            "id": "374213",
            "children": []
          }
        ]
      },
      {
        "name": "Ergonomic Supports",
        "id": "313247",
        "children": [
          {
            "name": "Back Supports",
            "id": "374174",
            "children": []
          },
          {
            "name": "Knee Pads and Supports",
            "id": "374175",
            "children": []
          }
        ]
      },
      {
        "name": "Respirators and Dust Masks",
        "id": "313262",
        "children": [
          {
            "name": "Respirator Cartridges and Filters",
            "id": "374200",
            "children": []
          },
          {
            "name": "Respirators",
            "id": "374201",
            "children": []
          }
        ]
      },
      {
        "name": "Eye Protection",
        "id": "313276",
        "children": [
          {
            "name": "Face Shields",
            "id": "374164",
            "children": []
          },
          {
            "name": "Safety Glasses",
            "id": "374165",
            "children": []
          },
          {
            "name": "Safety Goggles",
            "id": "374166",
            "children": []
          }
        ]
      },
      {
        "name": "Gas Detection and Confined Space Equipment",
        "id": "374202",
        "children": [
          {
            "name": "Gas Detectors and Accessories",
            "id": "374203",
            "children": []
          },
          {
            "name": "Ventilation Blowers",
            "id": "374204",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Hand Tools",
    "id": "312781",
    "children": [
      {
        "name": "Landscape Rakes, Shovels and Tools",
        "id": "312818",
        "children": [
          {
            "name": "Axes and Hatchets",
            "id": "312941",
            "children": []
          },
          {
            "name": "Hoes",
            "id": "313007",
            "children": []
          },
          {
            "name": "Digging Bars",
            "id": "313044",
            "children": []
          },
          {
            "name": "Picks and Mattocks",
            "id": "313212",
            "children": []
          },
          {
            "name": "Post Hole Diggers and Augers",
            "id": "313226",
            "children": []
          },
          {
            "name": "Landscape Rakes",
            "id": "313248",
            "children": []
          },
          {
            "name": "Shovels and Shovel Handles",
            "id": "313298",
            "children": []
          }
        ]
      },
      {
        "name": "Hammers and Striking Tools",
        "id": "312821",
        "children": [
          {
            "name": "Framing Hammers",
            "id": "313110",
            "children": []
          },
          {
            "name": "Hammer Handles",
            "id": "313260",
            "children": []
          },
          {
            "name": "Sledgehammers",
            "id": "313302",
            "children": []
          },
          {
            "name": "Brick And Masonry Hammers",
            "id": "442764",
            "children": []
          },
          {
            "name": "Rubber Mallets",
            "id": "442766",
            "children": []
          }
        ]
      },
      {
        "name": "Clamps, Vises and Magnets",
        "id": "312825",
        "children": [
          {
            "name": "Clamps",
            "id": "312948",
            "children": []
          },
          {
            "name": "Pipe Vises and Stands",
            "id": "313356",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete and Masonry Trowels",
        "id": "312832",
        "children": [
          {
            "name": "Brick Trowels",
            "id": "312958",
            "children": []
          },
          {
            "name": "Cement Trowels",
            "id": "312962",
            "children": []
          },
          {
            "name": "Finishing Trowels",
            "id": "312992",
            "children": []
          },
          {
            "name": "Fresnos",
            "id": "313065",
            "children": []
          },
          {
            "name": "General Purpose Concrete Trowels",
            "id": "313105",
            "children": []
          },
          {
            "name": "Margin Trowels",
            "id": "313107",
            "children": []
          },
          {
            "name": "Pool Trowels",
            "id": "313137",
            "children": []
          }
        ]
      },
      {
        "name": "Caulk and Grease Guns",
        "id": "312840",
        "children": [
          {
            "name": "Caulk Gun Accessories",
            "id": "312978",
            "children": []
          },
          {
            "name": "Grease Guns",
            "id": "313124",
            "children": []
          },
          {
            "name": "Caulk Guns",
            "id": "373973",
            "children": []
          }
        ]
      },
      {
        "name": "Masonry Mud Mixers and Pans",
        "id": "312844",
        "children": [
          {
            "name": "Cement and Mortar Mixing Tubs",
            "id": "312983",
            "children": []
          }
        ]
      },
      {
        "name": "Chisels",
        "id": "312847",
        "children": [
          {
            "name": "Cold Chisels",
            "id": "312991",
            "children": []
          },
          {
            "name": "Masonry Chisels",
            "id": "373974",
            "children": []
          },
          {
            "name": "Wood Chisels",
            "id": "373975",
            "children": []
          }
        ]
      },
      {
        "name": "Pliers",
        "id": "312859",
        "children": [
          {
            "name": "Crimpers",
            "id": "313072",
            "children": []
          },
          {
            "name": "Cutting Pliers",
            "id": "313127",
            "children": []
          },
          {
            "name": "General Purpose Pliers",
            "id": "313156",
            "children": []
          },
          {
            "name": "Lineman's Pliers",
            "id": "313170",
            "children": []
          },
          {
            "name": "Locking Pliers",
            "id": "313174",
            "children": []
          }
        ]
      },
      {
        "name": "Plumbing Tools",
        "id": "312862",
        "children": [
          {
            "name": "Pipe Dies",
            "id": "313050",
            "children": []
          },
          {
            "name": "Pipe and Tubing Cutters",
            "id": "313213",
            "children": []
          },
          {
            "name": "Pipe Threaders",
            "id": "313215",
            "children": []
          }
        ]
      },
      {
        "name": "Hand Saws and Blades",
        "id": "312865",
        "children": [
          {
            "name": "Drywall Saws and Cutters",
            "id": "313059",
            "children": []
          },
          {
            "name": "Hack Saws",
            "id": "313131",
            "children": []
          },
          {
            "name": "Hack Saw Blades",
            "id": "313371",
            "children": []
          },
          {
            "name": "Hand Saws",
            "id": "374210",
            "children": []
          }
        ]
      },
      {
        "name": "Sockets, Ratchets and Wrenches",
        "id": "312870",
        "children": [
          {
            "name": "Adjustable Wrenches",
            "id": "312918",
            "children": []
          },
          {
            "name": "Box Wrenches",
            "id": "312956",
            "children": []
          },
          {
            "name": "Combination Wrenches and Sets",
            "id": "313005",
            "children": []
          },
          {
            "name": "Erection Wrenches and Bull Pins",
            "id": "313074",
            "children": []
          },
          {
            "name": "Socket Extensions and Adapters",
            "id": "313078",
            "children": []
          },
          {
            "name": "Impact Sockets",
            "id": "313153",
            "children": []
          },
          {
            "name": "Ratchets",
            "id": "313249",
            "children": []
          },
          {
            "name": "Socket and Ratchet Sets",
            "id": "313307",
            "children": []
          },
          {
            "name": "Torque Wrenches",
            "id": "313341",
            "children": []
          },
          {
            "name": "Pipe Wrenches",
            "id": "374003",
            "children": []
          },
          {
            "name": "Strap and Chain Wrenches",
            "id": "374004",
            "children": []
          }
        ]
      },
      {
        "name": "Screwdrivers, Nut Drivers and Hex Keys",
        "id": "312885",
        "children": [
          {
            "name": "Hex Keys",
            "id": "313142",
            "children": []
          },
          {
            "name": "Nut Drivers",
            "id": "313201",
            "children": []
          },
          {
            "name": "Screwdrivers",
            "id": "313287",
            "children": []
          }
        ]
      },
      {
        "name": "Pry and Crow Bars, Nail and Stake Pullers",
        "id": "312890",
        "children": [
          {
            "name": "Stake Pullers",
            "id": "313304",
            "children": []
          },
          {
            "name": "Wrecking, Pry, and Crow Bars",
            "id": "313372",
            "children": []
          }
        ]
      },
      {
        "name": "Rebar Tools",
        "id": "312892",
        "children": [
          {
            "name": "Rebar Benders",
            "id": "313252",
            "children": []
          },
          {
            "name": "Rebar Tying Tools",
            "id": "313256",
            "children": []
          }
        ]
      },
      {
        "name": "Bolt Cutters, Utility Knives and Multi Tools",
        "id": "312902",
        "children": [
          {
            "name": "Bolt Cutters",
            "id": "312795",
            "children": []
          },
          {
            "name": "Snips",
            "id": "313306",
            "children": []
          },
          {
            "name": "Utility Knife Blades",
            "id": "313348",
            "children": []
          },
          {
            "name": "Utility Knives",
            "id": "313349",
            "children": []
          }
        ]
      },
      {
        "name": "Knockouts and Punches",
        "id": "312920",
        "children": [
          {
            "name": "Knockout Sets",
            "id": "374002",
            "children": []
          }
        ]
      },
      {
        "name": "Hand Sprayers and Accessories",
        "id": "313135",
        "children": [
          {
            "name": "Hand Sprayer Accessories",
            "id": "374000",
            "children": []
          },
          {
            "name": "Hand Sprayers",
            "id": "374001",
            "children": []
          }
        ]
      },
      {
        "name": "Tool Belts and Accessories",
        "id": "313338",
        "children": [
          {
            "name": "Tool Belt Accessories",
            "id": "374011",
            "children": []
          },
          {
            "name": "Tool Belts",
            "id": "374012",
            "children": []
          }
        ]
      },
      {
        "name": "Abrasives, Hand Files and Planers",
        "id": "373971",
        "children": [
          {
            "name": "Hand Files",
            "id": "313086",
            "children": []
          },
          {
            "name": "Sand Paper, Sponges and Rubbing Bricks",
            "id": "313273",
            "children": []
          },
          {
            "name": "Drywall Sanders and Rasps",
            "id": "373972",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Edging, Groovers and Jointers",
        "id": "373976",
        "children": [
          {
            "name": "Chamfer Tools",
            "id": "373977",
            "children": []
          },
          {
            "name": "Corner Tools",
            "id": "373978",
            "children": []
          },
          {
            "name": "Curb Tools",
            "id": "373979",
            "children": []
          },
          {
            "name": "Edgers",
            "id": "373980",
            "children": []
          },
          {
            "name": "Groovers",
            "id": "373981",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Finishing Brooms and Brushes",
        "id": "373982",
        "children": [
          {
            "name": "Acid and Masonry Brushes",
            "id": "373983",
            "children": []
          },
          {
            "name": "Concrete Finishing Brooms",
            "id": "373984",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Floats and Darbies",
        "id": "373985",
        "children": [
          {
            "name": "Bull Floats",
            "id": "373986",
            "children": []
          },
          {
            "name": "Channel Floats",
            "id": "373987",
            "children": []
          },
          {
            "name": "Darbies",
            "id": "373988",
            "children": []
          },
          {
            "name": "Hand Floats",
            "id": "373989",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Hand Tool Brackets and Handles",
        "id": "373990",
        "children": [
          {
            "name": "Brackets, Adapters, and Handles",
            "id": "373991",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Screeds and Spreaders",
        "id": "373992",
        "children": [
          {
            "name": "Concrete Screeds",
            "id": "373993",
            "children": []
          },
          {
            "name": "Asphalt Lutes and Rakes",
            "id": "373994",
            "children": []
          },
          {
            "name": "Concrete Placers and Spreaders",
            "id": "373995",
            "children": []
          },
          {
            "name": "Squeegees",
            "id": "373996",
            "children": []
          }
        ]
      },
      {
        "name": "Floor Scrapers and Blades",
        "id": "373997",
        "children": [
          {
            "name": "Floor Scraper Blades",
            "id": "373998",
            "children": []
          },
          {
            "name": "Floor Scrapers",
            "id": "373999",
            "children": []
          }
        ]
      },
      {
        "name": "Staplers and Tackers",
        "id": "374005",
        "children": [
          {
            "name": "Hammer Tackers",
            "id": "374006",
            "children": []
          },
          {
            "name": "Staplers",
            "id": "374007",
            "children": []
          }
        ]
      },
      {
        "name": "Taps and Dies",
        "id": "374008",
        "children": [
          {
            "name": "Dies",
            "id": "374009",
            "children": []
          },
          {
            "name": "Taps",
            "id": "374010",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Jobsite Supplies and Security",
    "id": "312782",
    "children": [
      {
        "name": "Job Site Communication",
        "id": "312796",
        "children": [
          {
            "name": "Job Site Radios",
            "id": "312908",
            "children": []
          },
          {
            "name": "Radio Accessories",
            "id": "374016",
            "children": []
          }
        ]
      },
      {
        "name": "Tapes and Glues",
        "id": "312809",
        "children": [
          {
            "name": "Strapping Tape and Poly Tape",
            "id": "312997",
            "children": []
          },
          {
            "name": "Duct Tape",
            "id": "313062",
            "children": []
          },
          {
            "name": "Plumbing and Electrical Tape",
            "id": "313068",
            "children": []
          },
          {
            "name": "Glues",
            "id": "313120",
            "children": []
          },
          {
            "name": "Painter and Masking Tape",
            "id": "313181",
            "children": []
          }
        ]
      },
      {
        "name": "Tarps and Plastic Sheeting",
        "id": "312864",
        "children": [
          {
            "name": "Tarps",
            "id": "313057",
            "children": []
          },
          {
            "name": "Plastic Sheeting",
            "id": "313219",
            "children": []
          }
        ]
      },
      {
        "name": "Surface Protection and Dust Containment",
        "id": "312867",
        "children": [
          {
            "name": "Dust Barrier Kits",
            "id": "313064",
            "children": []
          },
          {
            "name": "Floor Protection Paper and Masking",
            "id": "313106",
            "children": []
          }
        ]
      },
      {
        "name": "Water Hoses and Accessories",
        "id": "312873",
        "children": [
          {
            "name": "Fire Hose and Accessories",
            "id": "313090",
            "children": []
          },
          {
            "name": "Garden Hose and Accessories",
            "id": "313113",
            "children": []
          }
        ]
      },
      {
        "name": "Lubricants, Oils and Greases",
        "id": "312880",
        "children": [
          {
            "name": "Lubricants and Fuel",
            "id": "313111",
            "children": []
          },
          {
            "name": "Oil and Grease",
            "id": "313123",
            "children": []
          }
        ]
      },
      {
        "name": "Paint Brushes, Rollers and Trays",
        "id": "312883",
        "children": [
          {
            "name": "Paint Brushes",
            "id": "313206",
            "children": []
          },
          {
            "name": "Roller Trays",
            "id": "313207",
            "children": []
          },
          {
            "name": "Roller Covers",
            "id": "313208",
            "children": []
          },
          {
            "name": "Roller Frames",
            "id": "374211",
            "children": []
          }
        ]
      },
      {
        "name": "Job Site Safety",
        "id": "374017",
        "children": [
          {
            "name": "Air Horns and Whistles",
            "id": "312921",
            "children": []
          },
          {
            "name": "Safety Signs",
            "id": "374018",
            "children": []
          },
          {
            "name": "Safety Tags",
            "id": "374019",
            "children": []
          },
          {
            "name": "Hole Covers and Stair Nosing",
            "id": "442934",
            "children": []
          }
        ]
      },
      {
        "name": "Paint",
        "id": "374020",
        "children": [
          {
            "name": "Spray Paint",
            "id": "313313",
            "children": []
          }
        ]
      },
      {
        "name": "Solvents and Adhesive Removers",
        "id": "374021",
        "children": [
          {
            "name": "Solvents and Removers",
            "id": "374022",
            "children": []
          }
        ]
      },
      {
        "name": "Disposable Batteries",
        "id": "442762",
        "children": [
          {
            "name": "Disposable Standard Batteries",
            "id": "442763",
            "children": []
          }
        ]
      },
      {
        "name": "Office Supplies",
        "id": "442932",
        "children": [
          {
            "name": "Notebooks and Paper Products",
            "id": "442933",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Power Tools and Equipment",
    "id": "312783",
    "children": [
      {
        "name": "Core Drills and Accessories",
        "id": "312793",
        "children": [
          {
            "name": "Core Drills",
            "id": "312905",
            "children": []
          },
          {
            "name": "Core Drill Accessories",
            "id": "313029",
            "children": []
          }
        ]
      },
      {
        "name": "Air Compressors and Accessories",
        "id": "312806",
        "children": [
          {
            "name": "Air Hose Fittings",
            "id": "312919",
            "children": []
          },
          {
            "name": "Air Compressors",
            "id": "312966",
            "children": []
          },
          {
            "name": "Air Blow Guns and Inflators",
            "id": "374089",
            "children": []
          },
          {
            "name": "Air Compressor Hoses",
            "id": "374090",
            "children": []
          }
        ]
      },
      {
        "name": "Air Scrubbers and Negative Air Machines",
        "id": "312808",
        "children": [
          {
            "name": "Air Scrubbers",
            "id": "312922",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Vibrators and Accessories",
        "id": "312820",
        "children": [
          {
            "name": "Concrete Vibrators",
            "id": "312943",
            "children": []
          },
          {
            "name": "Vibrator Heads",
            "id": "374106",
            "children": []
          },
          {
            "name": "Vibrator Flex Shafts",
            "id": "374108",
            "children": []
          }
        ]
      },
      {
        "name": "Vacuums, Dust Extractors and Accessories",
        "id": "312848",
        "children": [
          {
            "name": "Dust Extractors",
            "id": "374159",
            "children": []
          },
          {
            "name": "Vacuum Accessories",
            "id": "374160",
            "children": []
          },
          {
            "name": "Vacuums",
            "id": "374161",
            "children": []
          }
        ]
      },
      {
        "name": "Power Sprayers and Accessories",
        "id": "312884",
        "children": [
          {
            "name": "Power Sprayers",
            "id": "313233",
            "children": []
          }
        ]
      },
      {
        "name": "Power Sanders, Polishers, and Accessories",
        "id": "312993",
        "children": [
          {
            "name": "Power Sanders",
            "id": "374140",
            "children": []
          }
        ]
      },
      {
        "name": "Compactors and Rammers",
        "id": "313006",
        "children": [
          {
            "name": "Compactors",
            "id": "374092",
            "children": []
          },
          {
            "name": "Rammers",
            "id": "374093",
            "children": []
          }
        ]
      },
      {
        "name": "Power Drills, Drivers and Impacts",
        "id": "313053",
        "children": [
          {
            "name": "Hammer Drills",
            "id": "374125",
            "children": []
          },
          {
            "name": "Impact Drivers",
            "id": "374126",
            "children": []
          },
          {
            "name": "Impact Wrenches",
            "id": "374127",
            "children": []
          },
          {
            "name": "Power Drills",
            "id": "374128",
            "children": []
          },
          {
            "name": "Right-Angle Drills",
            "id": "374129",
            "children": []
          }
        ]
      },
      {
        "name": "Generators and Accessories",
        "id": "313117",
        "children": [
          {
            "name": "Generator Accessories",
            "id": "374109",
            "children": []
          },
          {
            "name": "Generators",
            "id": "374110",
            "children": []
          }
        ]
      },
      {
        "name": "Power Multitools",
        "id": "313141",
        "children": [
          {
            "name": "Oscillating Multitools",
            "id": "374131",
            "children": []
          },
          {
            "name": "Rotary Multitools",
            "id": "374132",
            "children": []
          }
        ]
      },
      {
        "name": "Leaf Blowers",
        "id": "313166",
        "children": [
          {
            "name": "Backpack Blowers",
            "id": "374118",
            "children": []
          },
          {
            "name": "Handheld Blowers",
            "id": "374119",
            "children": []
          }
        ]
      },
      {
        "name": "Heaters, Fans, and Dryers",
        "id": "313224",
        "children": [
          {
            "name": "Fans and Blowers",
            "id": "374116",
            "children": []
          },
          {
            "name": "Heaters",
            "id": "374117",
            "children": []
          }
        ]
      },
      {
        "name": "Power Tool Combo Kits",
        "id": "313234",
        "children": [
          {
            "name": "Cordless Power Tool Combo Kits",
            "id": "374152",
            "children": []
          }
        ]
      },
      {
        "name": "Power Nailers and Staplers",
        "id": "313235",
        "children": [
          {
            "name": "Pneumatic Staplers",
            "id": "374133",
            "children": []
          },
          {
            "name": "Power Nailers",
            "id": "374134",
            "children": []
          }
        ]
      },
      {
        "name": "Pressure Washers and Accessories",
        "id": "313239",
        "children": [
          {
            "name": "Pressure Washer Accessories",
            "id": "374153",
            "children": []
          },
          {
            "name": "Pressure Washers",
            "id": "374154",
            "children": []
          }
        ]
      },
      {
        "name": "Pumps and Accessories",
        "id": "313241",
        "children": [
          {
            "name": "Pump Accessories",
            "id": "313089",
            "children": []
          },
          {
            "name": "Electric and Gas Powered Water Pumps",
            "id": "374155",
            "children": []
          }
        ]
      },
      {
        "name": "Rotary Hammers and Demolition Tools",
        "id": "313270",
        "children": [
          {
            "name": "Breaker Hammers",
            "id": "374156",
            "children": []
          },
          {
            "name": "Demolition Hammers",
            "id": "374157",
            "children": []
          },
          {
            "name": "Rotary Hammers",
            "id": "374158",
            "children": []
          }
        ]
      },
      {
        "name": "Power Grinders and Sanders",
        "id": "313272",
        "children": [
          {
            "name": "Angle and Disc Grinders",
            "id": "374130",
            "children": []
          },
          {
            "name": "Floor Grinders",
            "id": "442761",
            "children": []
          }
        ]
      },
      {
        "name": "Power Threaders and Stands",
        "id": "313292",
        "children": [
          {
            "name": "Power Threaders and Cutters",
            "id": "374151",
            "children": []
          }
        ]
      },
      {
        "name": "Welding Equipment",
        "id": "313363",
        "children": [
          {
            "name": "Welding Accessories",
            "id": "374162",
            "children": []
          },
          {
            "name": "Welding Torches and Kits",
            "id": "374163",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete and Masonry Saws",
        "id": "374094",
        "children": [
          {
            "name": "Concrete Saws",
            "id": "374095",
            "children": []
          },
          {
            "name": "Cutoff Saws",
            "id": "374145",
            "children": []
          },
          {
            "name": "Brick Saws",
            "id": "442765",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Finishing Equipment",
        "id": "374096",
        "children": [
          {
            "name": "Power Trowels and Trowel Blades",
            "id": "313236",
            "children": []
          },
          {
            "name": "Tampers, Stamps and Skins",
            "id": "374097",
            "children": []
          },
          {
            "name": "Power Screeds and Accessories",
            "id": "374098",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Mixers, Hoppers, and Chutes",
        "id": "374100",
        "children": [
          {
            "name": "Cement Mixers",
            "id": "374101",
            "children": []
          },
          {
            "name": "Concrete Chutes",
            "id": "374102",
            "children": []
          },
          {
            "name": "Concrete Hoppers",
            "id": "374103",
            "children": []
          },
          {
            "name": "Mixing Paddles",
            "id": "374113",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Testing and Inspection",
        "id": "374104",
        "children": [
          {
            "name": "Concrete Test Equipment",
            "id": "374105",
            "children": []
          }
        ]
      },
      {
        "name": "Heat Guns",
        "id": "374114",
        "children": [
          {
            "name": "Corded Heat Guns",
            "id": "374115",
            "children": []
          }
        ]
      },
      {
        "name": "Power Caulking and Grease Guns",
        "id": "374122",
        "children": [
          {
            "name": "Power Caulking Guns",
            "id": "374123",
            "children": []
          },
          {
            "name": "Power Grease Guns",
            "id": "374124",
            "children": []
          }
        ]
      },
      {
        "name": "Power Cutters, Benders, Shears and Tie Wire Tools",
        "id": "374135",
        "children": [
          {
            "name": "Rebar Cutters and Benders",
            "id": "374136",
            "children": []
          },
          {
            "name": "Rebar Tie Wire Tools",
            "id": "374137",
            "children": []
          },
          {
            "name": "Power Shears",
            "id": "442685",
            "children": []
          },
          {
            "name": "Power Cable Cutters",
            "id": "442759",
            "children": []
          }
        ]
      },
      {
        "name": "Power Saws",
        "id": "374141",
        "children": [
          {
            "name": "Bandsaws",
            "id": "374142",
            "children": []
          },
          {
            "name": "Chain Saws and Accessories",
            "id": "374143",
            "children": []
          },
          {
            "name": "Circular Saws",
            "id": "374144",
            "children": []
          },
          {
            "name": "Jig Saws",
            "id": "374146",
            "children": []
          },
          {
            "name": "Metal Cutting Chop Saws",
            "id": "374147",
            "children": []
          },
          {
            "name": "Miter Saws",
            "id": "374148",
            "children": []
          },
          {
            "name": "Reciprocating Saws",
            "id": "374149",
            "children": []
          },
          {
            "name": "Table Saws",
            "id": "374150",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Building Materials",
    "id": "312784",
    "children": [
      {
        "name": "Pipe, Plumbing and Drainage",
        "id": "312790",
        "children": [
          {
            "name": "Channel Drain Fittings",
            "id": "312988",
            "children": []
          },
          {
            "name": "Channel Drain Grates",
            "id": "312989",
            "children": []
          },
          {
            "name": "Channel Drains",
            "id": "312990",
            "children": []
          },
          {
            "name": "HDPE Corrugated Pipe and Fittings",
            "id": "313030",
            "children": []
          },
          {
            "name": "PVC Pipe and Fittings",
            "id": "313246",
            "children": []
          },
          {
            "name": "Brass Pipe and Pipe Fittings",
            "id": "390730",
            "children": []
          },
          {
            "name": "Black Pipe and Pipe Fittings",
            "id": "390731",
            "children": []
          }
        ]
      },
      {
        "name": "Access Doors and Area Wells",
        "id": "312801",
        "children": [
          {
            "name": "Area Wells and Accessories",
            "id": "312914",
            "children": []
          },
          {
            "name": "Fire Rated Access Doors",
            "id": "312936",
            "children": []
          },
          {
            "name": "Non-Fire Rated Access Doors",
            "id": "313365",
            "children": []
          }
        ]
      },
      {
        "name": "Lumber and Plywood",
        "id": "312860",
        "children": [
          {
            "name": "Backer Board",
            "id": "313012",
            "children": []
          },
          {
            "name": "Framing Lumber",
            "id": "313045",
            "children": []
          },
          {
            "name": "Plywood and Siding",
            "id": "313223",
            "children": []
          },
          {
            "name": "Shims and Furring Strips",
            "id": "313296",
            "children": []
          }
        ]
      },
      {
        "name": "Firestop Materials",
        "id": "312875",
        "children": [
          {
            "name": "Fire Protection Caulk and Silicones",
            "id": "313093",
            "children": []
          },
          {
            "name": "Fire Protection Strips and Collars",
            "id": "313094",
            "children": []
          },
          {
            "name": "Fire Protection Pillows, Sheets and Wool",
            "id": "313096",
            "children": []
          },
          {
            "name": "Fire Protection Mortar and Putty",
            "id": "313098",
            "children": []
          }
        ]
      },
      {
        "name": "Insulation",
        "id": "312879",
        "children": [
          {
            "name": "Insulation Sheets",
            "id": "313152",
            "children": []
          },
          {
            "name": "Insulating Foam and Applicators",
            "id": "313312",
            "children": []
          }
        ]
      },
      {
        "name": "Roofing Materials",
        "id": "312893",
        "children": [
          {
            "name": "Roll Roofing and Felt",
            "id": "313267",
            "children": []
          }
        ]
      },
      {
        "name": "Brick, Block and Masonry Supplies",
        "id": "373911",
        "children": [
          {
            "name": "Brick and Concrete Block",
            "id": "312957",
            "children": []
          },
          {
            "name": "Concrete Pavers",
            "id": "373912",
            "children": []
          },
          {
            "name": "Masonry Supplies",
            "id": "383677",
            "children": []
          }
        ]
      },
      {
        "name": "Fencing and Accessories",
        "id": "373913",
        "children": [
          {
            "name": "Fence Posts",
            "id": "373914",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Electrical and Lighting",
    "id": "312785",
    "children": [
      {
        "name": "Conduit, Cable and Wiring Devices",
        "id": "312802",
        "children": [
          {
            "name": "Conduit and Conduit Fittings",
            "id": "312973",
            "children": []
          },
          {
            "name": "Hanger Wire",
            "id": "313119",
            "children": []
          },
          {
            "name": "Electrical Plugs and Receptacles",
            "id": "313221",
            "children": []
          },
          {
            "name": "Conduit Fasteners and Boxes",
            "id": "373965",
            "children": []
          }
        ]
      },
      {
        "name": "Extension Cords and Adapters",
        "id": "312837",
        "children": [
          {
            "name": "Cord Adapters",
            "id": "312974",
            "children": []
          },
          {
            "name": "Extension Cords",
            "id": "313066",
            "children": []
          }
        ]
      },
      {
        "name": "Fish Tapes and Wire Pulling",
        "id": "312876",
        "children": [
          {
            "name": "Cable Grips",
            "id": "313042",
            "children": []
          },
          {
            "name": "Fish Tape",
            "id": "313100",
            "children": []
          },
          {
            "name": "Pull Line",
            "id": "313240",
            "children": []
          },
          {
            "name": "Power Fishing Systems",
            "id": "313369",
            "children": []
          }
        ]
      },
      {
        "name": "Lighting",
        "id": "312878",
        "children": [
          {
            "name": "Flashlights",
            "id": "313104",
            "children": []
          },
          {
            "name": "Portable Worklights",
            "id": "313139",
            "children": []
          },
          {
            "name": "Light Bulbs",
            "id": "313169",
            "children": []
          },
          {
            "name": "Light Strings and Trouble Lights",
            "id": "373967",
            "children": []
          }
        ]
      },
      {
        "name": "Conduit Benders, Cutters and Accessories",
        "id": "313023",
        "children": [
          {
            "name": "Conduit Benders and Cutters",
            "id": "373963",
            "children": []
          },
          {
            "name": "Conduit Cutter Accessories",
            "id": "373964",
            "children": []
          }
        ]
      },
      {
        "name": "Electrical Testing and Measuring Tools",
        "id": "313069",
        "children": [
          {
            "name": "Meters and Testers",
            "id": "373966",
            "children": []
          },
          {
            "name": "Inspection Cameras",
            "id": "442758",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Anchoring and Fasteners",
    "id": "312786",
    "children": [
      {
        "name": "Adhesive Anchoring",
        "id": "312803",
        "children": [
          {
            "name": "Adhesive Anchoring Brushes and Nozzles",
            "id": "312916",
            "children": []
          },
          {
            "name": "Adhesive Anchor Dispensing Guns",
            "id": "312927",
            "children": []
          },
          {
            "name": "Anchoring Epoxies",
            "id": "312929",
            "children": []
          }
        ]
      },
      {
        "name": "Framing Connectors",
        "id": "312811",
        "children": [
          {
            "name": "Framing Caps and Bases",
            "id": "312932",
            "children": []
          },
          {
            "name": "Framing Angles and Clips",
            "id": "312933",
            "children": []
          },
          {
            "name": "Joist Hangers and Straps",
            "id": "312950",
            "children": []
          },
          {
            "name": "Hurricane Ties and Holdowns",
            "id": "313000",
            "children": []
          }
        ]
      },
      {
        "name": "Mechanical Anchors",
        "id": "312813",
        "children": [
          {
            "name": "Anchor Bolts",
            "id": "312926",
            "children": []
          },
          {
            "name": "Drop-In Anchor Setting Tools",
            "id": "312930",
            "children": []
          },
          {
            "name": "Drive Anchors",
            "id": "313055",
            "children": []
          },
          {
            "name": "Drop-In Anchors",
            "id": "313058",
            "children": []
          },
          {
            "name": "Hollow Wall Anchors",
            "id": "313149",
            "children": []
          },
          {
            "name": "Rod Hangers",
            "id": "313266",
            "children": []
          },
          {
            "name": "Screw Anchors",
            "id": "313285",
            "children": []
          },
          {
            "name": "Sleeve Anchors",
            "id": "313303",
            "children": []
          },
          {
            "name": "Wedge Anchors",
            "id": "313361",
            "children": []
          }
        ]
      },
      {
        "name": "Strut, Strut Connectors and Fittings",
        "id": "312814",
        "children": [
          {
            "name": "Strut Pipe and Beam Clamps",
            "id": "312931",
            "children": []
          },
          {
            "name": "Strut Channel",
            "id": "313325",
            "children": []
          },
          {
            "name": "Strut Plates and Angle Fittings",
            "id": "373904",
            "children": []
          },
          {
            "name": "Strut Washers and Nuts",
            "id": "373905",
            "children": []
          }
        ]
      },
      {
        "name": "Nails, Rivets, and Staples",
        "id": "312834",
        "children": [
          {
            "name": "Brad Nails",
            "id": "312965",
            "children": []
          },
          {
            "name": "Collated Nails",
            "id": "313001",
            "children": []
          },
          {
            "name": "Rivets",
            "id": "313264",
            "children": []
          },
          {
            "name": "Staples",
            "id": "313318",
            "children": []
          },
          {
            "name": "Concrete and Masonry Nails",
            "id": "373897",
            "children": []
          },
          {
            "name": "Duplex Nails",
            "id": "373898",
            "children": []
          },
          {
            "name": "Finishing Nails",
            "id": "373899",
            "children": []
          },
          {
            "name": "Framing Nails",
            "id": "373900",
            "children": []
          },
          {
            "name": "Roofing Nails",
            "id": "373901",
            "children": []
          }
        ]
      },
      {
        "name": "Screws",
        "id": "312843",
        "children": [
          {
            "name": "Deck Screws",
            "id": "313038",
            "children": []
          },
          {
            "name": "Drywall Screws",
            "id": "313060",
            "children": []
          },
          {
            "name": "Wood Screws",
            "id": "313087",
            "children": []
          },
          {
            "name": "Lag Screws",
            "id": "313163",
            "children": []
          },
          {
            "name": "Lath Screws",
            "id": "313165",
            "children": []
          },
          {
            "name": "Machine Screws",
            "id": "313178",
            "children": []
          },
          {
            "name": "Self-Drilling Screws",
            "id": "313291",
            "children": []
          }
        ]
      },
      {
        "name": "Powder Actuated Fastening",
        "id": "312850",
        "children": [
          {
            "name": "Powder Actuated Pins",
            "id": "313056",
            "children": []
          },
          {
            "name": "Powder Actuated Loads",
            "id": "313228",
            "children": []
          }
        ]
      },
      {
        "name": "Bolts",
        "id": "312953",
        "children": [
          {
            "name": "Eye Bolts",
            "id": "373895",
            "children": []
          },
          {
            "name": "Machine and Carriage Bolts",
            "id": "373896",
            "children": []
          }
        ]
      },
      {
        "name": "Nuts",
        "id": "313203",
        "children": [
          {
            "name": "Coupling Nuts",
            "id": "373902",
            "children": []
          },
          {
            "name": "Hex Nuts",
            "id": "373903",
            "children": []
          }
        ]
      },
      {
        "name": "Washers",
        "id": "313358",
        "children": [
          {
            "name": "Cut Washers",
            "id": "373906",
            "children": []
          },
          {
            "name": "Fender Washers",
            "id": "373907",
            "children": []
          },
          {
            "name": "Lock Washers",
            "id": "373908",
            "children": []
          },
          {
            "name": "Square Washers",
            "id": "373910",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Concrete and Chemicals",
    "id": "312787",
    "children": [
      {
        "name": "Concrete Primers, Releases and Bond Breakers",
        "id": "312815",
        "children": [
          {
            "name": "Bond Breakers",
            "id": "313011",
            "children": []
          },
          {
            "name": "Surface Primers",
            "id": "313013",
            "children": []
          },
          {
            "name": "Form Release",
            "id": "313019",
            "children": []
          }
        ]
      },
      {
        "name": "Cement, Concrete, Grout, Mortar and Bagged Aggregates",
        "id": "312842",
        "children": [
          {
            "name": "Cement",
            "id": "312980",
            "children": []
          },
          {
            "name": "Grout",
            "id": "313128",
            "children": []
          },
          {
            "name": "Mortar and Masonry Mixes",
            "id": "313190",
            "children": []
          },
          {
            "name": "Sand",
            "id": "313277",
            "children": []
          },
          {
            "name": "Anchoring Cement",
            "id": "373928",
            "children": []
          },
          {
            "name": "Gravel",
            "id": "373929",
            "children": []
          },
          {
            "name": "Concrete Mix",
            "id": "374207",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete and Masonry Cleaning",
        "id": "312849",
        "children": [
          {
            "name": "Concrete Cleaners and Degreasers",
            "id": "312995",
            "children": []
          },
          {
            "name": "Concrete Dissolvers",
            "id": "313278",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Repair and Restoration",
        "id": "373930",
        "children": [
          {
            "name": "Concrete Repair Epoxies",
            "id": "373931",
            "children": []
          },
          {
            "name": "General Purpose Repair Mortars",
            "id": "373932",
            "children": []
          },
          {
            "name": "Penetrating Sealers",
            "id": "373933",
            "children": []
          },
          {
            "name": "Self Leveling Underlayments",
            "id": "373934",
            "children": []
          },
          {
            "name": "Surface Repair and Patching",
            "id": "373935",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Treatments, Cures Hardeners and Finishing",
        "id": "373936",
        "children": [
          {
            "name": "Admixtures",
            "id": "373937",
            "children": []
          },
          {
            "name": "Concrete Stains and Dyes",
            "id": "373938",
            "children": []
          },
          {
            "name": "Decorative Concrete Treatments",
            "id": "373939",
            "children": []
          },
          {
            "name": "DOT Cures",
            "id": "373940",
            "children": []
          },
          {
            "name": "Hardeners and Densifiers",
            "id": "373941",
            "children": []
          },
          {
            "name": "Non-DOT Cures and Sealers",
            "id": "373942",
            "children": []
          },
          {
            "name": "Retarders and Finishing Aids",
            "id": "373943",
            "children": []
          },
          {
            "name": "Ice Melting Compounds",
            "id": "395954",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Measuring, Marking and Surveying",
    "id": "312788",
    "children": [
      {
        "name": "Lasers and Surveying",
        "id": "312816",
        "children": [
          {
            "name": "Rotary Lasers",
            "id": "312939",
            "children": []
          },
          {
            "name": "Line and Dot Lasers",
            "id": "313101",
            "children": []
          },
          {
            "name": "Surveying Accessories",
            "id": "313257",
            "children": []
          },
          {
            "name": "Surveyor Flags and Tape",
            "id": "374031",
            "children": []
          }
        ]
      },
      {
        "name": "Squares, Levels and Measuring Tape",
        "id": "312817",
        "children": [
          {
            "name": "Levels and Plumb Bobs",
            "id": "312940",
            "children": []
          },
          {
            "name": "Squares",
            "id": "313004",
            "children": []
          },
          {
            "name": "Measuring Tapes",
            "id": "313186",
            "children": []
          },
          {
            "name": "Rulers",
            "id": "374032",
            "children": []
          }
        ]
      },
      {
        "name": "Marking Tools, Paint and Markers",
        "id": "312846",
        "children": [
          {
            "name": "Chalk and Reels",
            "id": "312986",
            "children": []
          },
          {
            "name": "Crayons, Markers and Pencils",
            "id": "313033",
            "children": []
          },
          {
            "name": "Marking Paint",
            "id": "313180",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Material Handling and Storage",
    "id": "312789",
    "children": [
      {
        "name": "Steel Banding and Load Security",
        "id": "312823",
        "children": [
          {
            "name": "Load Binders and Tie Down Straps",
            "id": "313172",
            "children": []
          },
          {
            "name": "Shrink Wrap",
            "id": "313299",
            "children": []
          },
          {
            "name": "Steel Banding",
            "id": "313319",
            "children": []
          }
        ]
      },
      {
        "name": "Wheelbarrows, Tilt Trucks and Utility Carts",
        "id": "312824",
        "children": [
          {
            "name": "Pipe and Wire Carts",
            "id": "312947",
            "children": []
          },
          {
            "name": "Tilt Trucks and Utility Carts",
            "id": "313333",
            "children": []
          },
          {
            "name": "Wheelbarrows and Accessories",
            "id": "313364",
            "children": []
          }
        ]
      },
      {
        "name": "Lifting and Rigging",
        "id": "312835",
        "children": [
          {
            "name": "Jacks",
            "id": "312955",
            "children": []
          },
          {
            "name": "Cable and Chain",
            "id": "312970",
            "children": []
          },
          {
            "name": "Hoists, Cable and Chain Pullers",
            "id": "313145",
            "children": []
          },
          {
            "name": "Lifting Slings",
            "id": "313168",
            "children": []
          },
          {
            "name": "Rigging Hardware",
            "id": "313263",
            "children": []
          },
          {
            "name": "Chain Lift Assemblies",
            "id": "374030",
            "children": []
          }
        ]
      },
      {
        "name": "Tool Storage",
        "id": "312838",
        "children": [
          {
            "name": "Tool Boxes and Tool Bags",
            "id": "313336",
            "children": []
          },
          {
            "name": "Tool Cabinets and Chests",
            "id": "313340",
            "children": []
          },
          {
            "name": "Truck Boxes and Racks",
            "id": "313345",
            "children": []
          }
        ]
      },
      {
        "name": "Cable Ties, Rope and Twine",
        "id": "312888",
        "children": [
          {
            "name": "Mason Line",
            "id": "313182",
            "children": []
          },
          {
            "name": "Rope",
            "id": "313269",
            "children": []
          },
          {
            "name": "Cable Ties",
            "id": "374027",
            "children": []
          }
        ]
      },
      {
        "name": "Office Supplies and Equipment",
        "id": "313048",
        "children": [
          {
            "name": "Office Equipment",
            "id": "374028",
            "children": []
          }
        ]
      },
      {
        "name": "Gas Cans and Accessories",
        "id": "313115",
        "children": [
          {
            "name": "Gas Cans",
            "id": "374029",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Waterproofing",
    "id": "312791",
    "children": [
      {
        "name": "Building Paper, Flashing and House Wrap",
        "id": "312804",
        "children": [
          {
            "name": "Flashing",
            "id": "312917",
            "children": []
          },
          {
            "name": "Building Paper and House Wrap",
            "id": "312964",
            "children": []
          },
          {
            "name": "Termination Bars",
            "id": "313329",
            "children": []
          }
        ]
      },
      {
        "name": "Waterproof Coatings and Membranes",
        "id": "312903",
        "children": [
          {
            "name": "Liquid Applied Waterproof Membranes",
            "id": "312984",
            "children": []
          },
          {
            "name": "Sheet Applied Waterproof Membranes",
            "id": "313171",
            "children": []
          },
          {
            "name": "Under Slab Waterproofing Membranes",
            "id": "313294",
            "children": []
          },
          {
            "name": "Below Grade Waterproofing",
            "id": "313347",
            "children": []
          },
          {
            "name": "Air and Vapor Barriers",
            "id": "313353",
            "children": []
          },
          {
            "name": "Composite Drain Boards and Accessories",
            "id": "313354",
            "children": []
          },
          {
            "name": "Underslab Vapor Barriers and Sealing Tape",
            "id": "313359",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Erosion Control and Geosynthetics",
    "id": "312792",
    "children": [
      {
        "name": "Sand and Gravel Bags",
        "id": "312868",
        "children": [
          {
            "name": "Sand Bags",
            "id": "313071",
            "children": []
          }
        ]
      },
      {
        "name": "Erosion Control Blankets and Fasteners",
        "id": "312882",
        "children": [
          {
            "name": "Erosion Control Blankets",
            "id": "313118",
            "children": []
          }
        ]
      },
      {
        "name": "Stormwater Management",
        "id": "312886",
        "children": [
          {
            "name": "Washout Pans",
            "id": "313154",
            "children": []
          },
          {
            "name": "Dewatering Bags",
            "id": "313290",
            "children": []
          }
        ]
      },
      {
        "name": "Wattles, Logs, and Composite Socks",
        "id": "312887",
        "children": [
          {
            "name": "Wattles",
            "id": "313360",
            "children": []
          }
        ]
      },
      {
        "name": "Geotextiles",
        "id": "313198",
        "children": [
          {
            "name": "Geogrids",
            "id": "313200",
            "children": []
          },
          {
            "name": "Nonwoven Fabrics",
            "id": "373968",
            "children": []
          },
          {
            "name": "Woven Fabrics",
            "id": "373969",
            "children": []
          }
        ]
      },
      {
        "name": "Silt Fences and Stakes",
        "id": "313300",
        "children": [
          {
            "name": "Silt Fences",
            "id": "373970",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Power Tool and Equipment Accessories",
    "id": "312798",
    "children": [
      {
        "name": "Abrasive Belts, Burs, Wheels and Blades",
        "id": "312911",
        "children": [
          {
            "name": "Abrasive Cups",
            "id": "374034",
            "children": []
          },
          {
            "name": "Abrasive Cutting Wheels",
            "id": "374035",
            "children": []
          },
          {
            "name": "Abrasive Flapper Wheels and Discs",
            "id": "374036",
            "children": []
          },
          {
            "name": "Sanding Belts, Rolls and Screens",
            "id": "374038",
            "children": []
          },
          {
            "name": "Diamond Cup Wheels",
            "id": "374041",
            "children": []
          },
          {
            "name": "Abrasive Grinding Wheels",
            "id": "374043",
            "children": []
          },
          {
            "name": "Abrasive Wire Wheels and Brushes",
            "id": "374212",
            "children": []
          },
          {
            "name": "Abrasive Burs",
            "id": "468080",
            "children": []
          }
        ]
      },
      {
        "name": "Bit Tips and Drivers",
        "id": "312951",
        "children": [
          {
            "name": "Bit Holders, Extensions and Socket Adapters",
            "id": "374047",
            "children": []
          },
          {
            "name": "Drilling and Driving Sets",
            "id": "374048",
            "children": []
          },
          {
            "name": "Nutsetters",
            "id": "374050",
            "children": []
          },
          {
            "name": "Insert and Power Bits",
            "id": "374051",
            "children": []
          },
          {
            "name": "Router Bits",
            "id": "374052",
            "children": []
          }
        ]
      },
      {
        "name": "Batteries, Chargers and Accessories",
        "id": "313027",
        "children": [
          {
            "name": "Cordless Tool Batteries",
            "id": "374039",
            "children": []
          },
          {
            "name": "Cordless Tool Chargers",
            "id": "374040",
            "children": []
          }
        ]
      },
      {
        "name": "Diamond Saw Blades",
        "id": "313043",
        "children": [
          {
            "name": "Crack Chasers and Tuck Point Blades",
            "id": "374037",
            "children": []
          },
          {
            "name": "Diamond Cutting Blades",
            "id": "374042",
            "children": []
          },
          {
            "name": "Diamond Early Entry Blades",
            "id": "374044",
            "children": []
          }
        ]
      },
      {
        "name": "Saw Blades and Accessories",
        "id": "313134",
        "children": [
          {
            "name": "Band Saw Blades",
            "id": "374078",
            "children": []
          },
          {
            "name": "Circular Saw Blades",
            "id": "374079",
            "children": []
          },
          {
            "name": "Hole Saws and Arbors",
            "id": "374080",
            "children": []
          },
          {
            "name": "Jig Saw Blades",
            "id": "374081",
            "children": []
          },
          {
            "name": "Power Saw Accessories",
            "id": "374084",
            "children": []
          },
          {
            "name": "Reciprocating Saw Blades",
            "id": "374085",
            "children": []
          }
        ]
      },
      {
        "name": "Power Tool Dust Shrouds, Guards and Adapters",
        "id": "313351",
        "children": [
          {
            "name": "Dust Collection Attachments",
            "id": "374086",
            "children": []
          },
          {
            "name": "Dust Shrouds",
            "id": "374087",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete and Masonry Drill Bits",
        "id": "374055",
        "children": [
          {
            "name": "Core Drill Bits",
            "id": "374056",
            "children": []
          },
          {
            "name": "Demolition Hammer Steel",
            "id": "374057",
            "children": []
          },
          {
            "name": "SDS Max Demolition Steel",
            "id": "374059",
            "children": []
          },
          {
            "name": "SDS Max Rotary Hammer Bits",
            "id": "374060",
            "children": []
          },
          {
            "name": "SDS Plus Rotary Hammer Bits",
            "id": "374061",
            "children": []
          },
          {
            "name": "Masonry Drill Bits",
            "id": "374062",
            "children": []
          },
          {
            "name": "Spline Shank Rotary Hammer Bits",
            "id": "374064",
            "children": []
          }
        ]
      },
      {
        "name": "Metal and Wood Drill Bits",
        "id": "374065",
        "children": [
          {
            "name": "Step Drill Bits",
            "id": "374054",
            "children": []
          },
          {
            "name": "Metal Drill Bits",
            "id": "374067",
            "children": []
          },
          {
            "name": "Straight Shank Rebar Cutters",
            "id": "374075",
            "children": []
          },
          {
            "name": "Wood Auger Bits",
            "id": "374076",
            "children": []
          },
          {
            "name": "Wood Spade Bits",
            "id": "374077",
            "children": []
          },
          {
            "name": "Glass And Tile Drill Bits",
            "id": "442760",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Concrete Forming and Accessories",
    "id": "312810",
    "children": [
      {
        "name": "Rebar and Wire Mesh Support",
        "id": "312826",
        "children": [
          {
            "name": "Bolsters",
            "id": "312949",
            "children": []
          },
          {
            "name": "Rebar",
            "id": "313250",
            "children": []
          },
          {
            "name": "Rebar Spacer Wheels",
            "id": "313253",
            "children": []
          },
          {
            "name": "Rebar Safety Caps",
            "id": "313254",
            "children": []
          },
          {
            "name": "Chair Supports",
            "id": "313255",
            "children": []
          },
          {
            "name": "Reinforcing Wire Mesh",
            "id": "313259",
            "children": []
          },
          {
            "name": "Tie Wire",
            "id": "313331",
            "children": []
          },
          {
            "name": "Rod Tighteners",
            "id": "373962",
            "children": []
          },
          {
            "name": "Dobies",
            "id": "374208",
            "children": []
          },
          {
            "name": "Rebar Splicers and Couplers",
            "id": "374209",
            "children": []
          }
        ]
      },
      {
        "name": "Tilt Up Precast Accessories and Patching",
        "id": "312851",
        "children": [
          {
            "name": "Tilt Up Bracing and Lifting Hardware",
            "id": "312999",
            "children": []
          },
          {
            "name": "Tilt Up and Precast Patching",
            "id": "313167",
            "children": []
          },
          {
            "name": "Tilt Up Forming Nuts, Plates and Shims",
            "id": "365074",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Curing Blankets",
        "id": "312857",
        "children": [
          {
            "name": "Wet Cure Blankets",
            "id": "313034",
            "children": []
          },
          {
            "name": "Curing Blankets",
            "id": "733157",
            "children": []
          }
        ]
      },
      {
        "name": "ADA Warning Tiles and Accessories",
        "id": "312858",
        "children": [
          {
            "name": "Cast-In-Place Detectable Tiles",
            "id": "313040",
            "children": []
          },
          {
            "name": "Surface-Applied Detectable Tiles",
            "id": "313041",
            "children": []
          }
        ]
      },
      {
        "name": "Waterstop and Waterstop Accessories",
        "id": "312866",
        "children": [
          {
            "name": "Waterstops",
            "id": "313063",
            "children": []
          },
          {
            "name": "Waterstop Splicing Irons",
            "id": "313310",
            "children": []
          }
        ]
      },
      {
        "name": "Steel and Wood Stakes",
        "id": "312898",
        "children": [
          {
            "name": "Steel Stakes",
            "id": "313321",
            "children": []
          },
          {
            "name": "Wood Stakes",
            "id": "444429",
            "children": []
          }
        ]
      },
      {
        "name": "Coil Rod, Fittings and Ties",
        "id": "312924",
        "children": [
          {
            "name": "Coil Bolts",
            "id": "373944",
            "children": []
          },
          {
            "name": "Coil Nuts",
            "id": "373945",
            "children": []
          },
          {
            "name": "Coil Rod and Ties",
            "id": "373946",
            "children": []
          }
        ]
      },
      {
        "name": "Concrete Forming",
        "id": "312925",
        "children": [
          {
            "name": "Chamfers and Reveals",
            "id": "312987",
            "children": []
          },
          {
            "name": "Void Caps",
            "id": "313357",
            "children": []
          },
          {
            "name": "Threaded Rod",
            "id": "313373",
            "children": []
          },
          {
            "name": "Cam Lock Ties",
            "id": "373947",
            "children": []
          },
          {
            "name": "Column Forms",
            "id": "373948",
            "children": []
          },
          {
            "name": "Concrete Forming Plugs",
            "id": "373949",
            "children": []
          },
          {
            "name": "Concrete Forming Shims",
            "id": "373950",
            "children": []
          },
          {
            "name": "Concrete Forming Sleeves",
            "id": "373951",
            "children": []
          },
          {
            "name": "Control Joints and Keyway",
            "id": "373952",
            "children": []
          },
          {
            "name": "Dowels, Caps and Baskets",
            "id": "373953",
            "children": []
          },
          {
            "name": "Expansion Board",
            "id": "373954",
            "children": []
          },
          {
            "name": "Flat Ties",
            "id": "373955",
            "children": []
          },
          {
            "name": "Loop Ties",
            "id": "373956",
            "children": []
          },
          {
            "name": "Panel Forms",
            "id": "373957",
            "children": []
          },
          {
            "name": "Pencil Rod",
            "id": "373958",
            "children": []
          },
          {
            "name": "Precast Curbs, Piers and Bumpers",
            "id": "373959",
            "children": []
          },
          {
            "name": "Snap Ties",
            "id": "373960",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Adhesives, Caulk and Sealants",
    "id": "312819",
    "children": [
      {
        "name": "Caulk and Sealant",
        "id": "312977",
        "children": [
          {
            "name": "Sealant",
            "id": "313288",
            "children": []
          },
          {
            "name": "Sealant Color Packs",
            "id": "313289",
            "children": []
          },
          {
            "name": "Caulk",
            "id": "373893",
            "children": []
          },
          {
            "name": "Joint and Crack Filler",
            "id": "374215",
            "children": []
          }
        ]
      },
      {
        "name": "Adhesives",
        "id": "373892",
        "children": [
          {
            "name": "Construction Adhesives",
            "id": "313024",
            "children": []
          }
        ]
      },
      {
        "name": "Backer Rod",
        "id": "466769",
        "children": []
      }
    ]
  },
  {
    "name": "Ladders and Scaffolding",
    "id": "312869",
    "children": [
      {
        "name": "Ladders, Ladder Parts and Accessories",
        "id": "313162",
        "children": [
          {
            "name": "Extension Ladders",
            "id": "313077",
            "children": []
          },
          {
            "name": "Straight Ladders",
            "id": "313193",
            "children": []
          },
          {
            "name": "Step Ladders",
            "id": "313322",
            "children": []
          },
          {
            "name": "Ladder Accessories",
            "id": "374023",
            "children": []
          },
          {
            "name": "Manhole Ladders and Accessories",
            "id": "374024",
            "children": []
          }
        ]
      },
      {
        "name": "Scaffolding and Accessories",
        "id": "313281",
        "children": [
          {
            "name": "Scaffolding",
            "id": "374025",
            "children": []
          },
          {
            "name": "Scaffolding Accessories",
            "id": "374026",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Cleaning Tools and Supplies",
    "id": "373915",
    "children": [
      {
        "name": "Brushes, Brooms, Mops and Accessories",
        "id": "373916",
        "children": [
          {
            "name": "Brooms and Accessories",
            "id": "373917",
            "children": []
          },
          {
            "name": "Magnetic Sweepers and Retrievers",
            "id": "373918",
            "children": []
          },
          {
            "name": "Mops and Accessories",
            "id": "373919",
            "children": []
          },
          {
            "name": "Wire and Utility Brushes",
            "id": "373920",
            "children": []
          }
        ]
      },
      {
        "name": "Cleaning Chemicals",
        "id": "373921",
        "children": [
          {
            "name": "General Purpose Cleaners",
            "id": "373922",
            "children": []
          }
        ]
      },
      {
        "name": "Trash Receptacles",
        "id": "373925",
        "children": [
          {
            "name": "Trash Bags",
            "id": "373926",
            "children": []
          },
          {
            "name": "Trash Cans and Receptacles",
            "id": "373927",
            "children": []
          }
        ]
      },
      {
        "name": "Cleaning Supplies",
        "id": "374205",
        "children": [
          {
            "name": "Buckets",
            "id": "373923",
            "children": []
          },
          {
            "name": "Paper Towels, Rags and Wipes",
            "id": "373924",
            "children": []
          },
          {
            "name": "Spray Bottles and Accessories",
            "id": "374206",
            "children": []
          }
        ]
      }
    ]
  },
  {
    "name": "Brick and Stone",
    "id": "892208",
    "children": [
      {
        "name": "Brick",
        "id": "892209",
        "children": []
      },
      {
        "name": "Stone",
        "id": "892215",
        "children": [
          {
            "name": "Natural",
            "id": "892216",
            "children": []
          }
        ]
      },
      {
        "name": "Reinforcement",
        "id": "892221",
        "children": []
      }
    ]
  },
  {
    "name": "Masonry Block, Pavers, Mortars and Accessories",
    "id": "892227",
    "children": [
      {
        "name": "Block",
        "id": "892240",
        "children": [
          {
            "name": "CMU Block",
            "id": "892245",
            "children": []
          }
        ]
      },
      {
        "name": "Pavers",
        "id": "892241",
        "children": [
          {
            "name": "Concrete",
            "id": "892253",
            "children": []
          }
        ]
      },
      {
        "name": "Mortars and Cementitious",
        "id": "892242",
        "children": []
      }
    ]
  },
  {
    "name": "Aldridge",
    "id": "Aldridge",
    "children": [
      {
        "name": "All Items",
        "id": "All Items",
        "children": []
      },
      {
        "name": "Commodities",
        "id": "Commodities",
        "children": []
      },
      {
        "name": "Concrete Forming and Accessories",
        "id": "Concrete Forming and Accessories",
        "children": []
      },
      {
        "name": "Drilling",
        "id": "Drilling",
        "children": []
      },
      {
        "name": "Erosion Control",
        "id": "Erosion Control",
        "children": []
      },
      {
        "name": "Hand Tools",
        "id": "Hand Tools",
        "children": []
      },
      {
        "name": "Jobsite Supplies",
        "id": "Jobsite Supplies",
        "children": []
      },
      {
        "name": "Material Handling & Storage",
        "id": "Material Handling & Storage",
        "children": []
      },
      {
        "name": "Power Tools & Equipment",
        "id": "Power Tools & Equipment",
        "children": []
      },
      {
        "name": "Safety",
        "id": "Safety",
        "children": []
      }
    ]
  },
  {
    "name": "non-catalog-feed-products",
    "id": "non-catalog-feed-products",
    "children": []
  },
  {
    "name": "Specials and Deals",
    "id": "Specials and Deals",
    "children": [
      {
        "name": "Bosch Deals",
        "id": "Bosch Deals",
        "children": []
      },
      {
        "name": "DeWalt",
        "id": "DeWalt",
        "children": []
      },
      {
        "name": "DeWalt Deals",
        "id": "DeWalt Deals",
        "children": []
      },
      {
        "name": "Makita Deals",
        "id": "Makita Deals",
        "children": []
      },
      {
        "name": "Milwaukee Deals",
        "id": "Milwaukee Deals",
        "children": []
      },
      {
        "name": "Milwaukee MX Fuel",
        "id": "Milwaukee MX Fuel",
        "children": []
      },
      {
        "name": "Multiquip Deals",
        "id": "Multiquip Deals",
        "children": []
      },
      {
        "name": "Top Deals",
        "id": "Top Deals",
        "children": []
      }
    ]
  },
  {
    "name": "World of Concrete Specials",
    "id": "World of Concrete Specials",
    "children": [
      {
        "name": "Chevron",
        "id": "Chevron",
        "children": []
      },
      {
        "name": "Husqvarna",
        "id": "Husqvarna",
        "children": []
      },
      {
        "name": "Knaack",
        "id": "Knaack",
        "children": []
      }
    ]
  },
  {
    "name": "World of Concrete Top Deals",
    "id": "World of Concrete Top Deals",
    "children": []
  }
];

export default function CategoryDropdown({ isOpen, onClose }: CategoryDropdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCategoryClick = (category: Category) => {
    // Use the category name for search (human-readable format)
    router.push(`/search?category=${encodeURIComponent(category.name)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-2xl z-50 max-h-[500px] overflow-hidden rounded-b-lg"
      style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    >
      <div className="flex min-h-[400px]">
        {/* Main Categories */}
        <div className="w-1/3 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="py-3">
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-white">
              Categories
            </div>
            {categories.map((category) => (
              <div
                key={category.name}
                className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200 ${
                  hoveredCategory === category.name
                    ? 'bg-yellow-400 text-black font-semibold border-l-4 border-yellow-600 shadow-md'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
                onMouseEnter={() => {
                  setHoveredCategory(category.name);
                  setHoveredSubCategory(null);
                }}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{category.name}</span>
                  {category.children.length > 0 && (
                    <svg className={`w-4 h-4 transition-colors ${
                      hoveredCategory === category.name ? 'text-black' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories */}
        {hoveredCategory && (
          <div className="w-1/3 border-r border-gray-200 bg-white">
            <div className="py-3">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                {hoveredCategory}
              </div>
              {categories
                .find((cat) => cat.name === hoveredCategory)
                ?.children.map((subCategory) => (
                  <div
                    key={subCategory.name}
                    className={`px-4 py-3 text-sm cursor-pointer transition-all duration-150 ${
                      hoveredSubCategory === subCategory.name
                        ? 'bg-yellow-300 text-black font-semibold border-l-3 border-yellow-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                    onMouseEnter={() => setHoveredSubCategory(subCategory.name)}
                    onClick={() => handleCategoryClick(subCategory)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{subCategory.name}</span>
                      {subCategory.children.length > 0 && (
                        <svg className={`w-4 h-4 transition-colors ${
                          hoveredSubCategory === subCategory.name ? 'text-black' : 'text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sub-subcategories */}
        {hoveredCategory && hoveredSubCategory && (
          <div className="w-1/3 bg-white">
            <div className="py-3">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                {hoveredSubCategory}
              </div>
              {categories
                .find((cat) => cat.name === hoveredCategory)
                ?.children.find((subCat) => subCat.name === hoveredSubCategory)
                ?.children.map((subSubCategory) => (
                  <div
                    key={subSubCategory.name}
                    className="px-4 py-3 text-sm cursor-pointer text-gray-600 hover:bg-yellow-50 hover:text-yellow-800 transition-all duration-150 group"
                    onClick={() => handleCategoryClick(subSubCategory)}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                      <span className="truncate font-medium">{subSubCategory.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
