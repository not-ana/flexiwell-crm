"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  ExternalLinkIcon,
  UserIcon,
  ClockIcon,
  PlusIcon,
} from "@/components/icons";

// Types
interface ClassCard {
  id: string;
  title: string;
  instructor: string;
  time: string;
  attendees: {
    id: string;
    name: string;
    avatar?: string;
    status: "yes" | "no" | "awaiting";
  }[];
}

// Mock user data
const mockUser = {
  name: "Jaya Willis",
  avatar: undefined,
  initials: "JW",
  location: "Melbourne, Australia",
  locationFlag: "🇦🇺",
  email: "hi@jayawillis.com",
  phone: "55 22 99813 6843",
  about: `I'm a Product Designer based in Melbourne, Australia. I enjoy working on product design, design systems, and Webflow projects, but I don't take myself too seriously.

I've worked with some of the world's most exciting companies, including Coinbase, Stripe, and Linear. I'm passionate about helping startups grow, improve their UX and customer experience, and to raise venture capital through good design.

My work has been featured on Typewolf, Mindsparkle Magazine, Webflow, Fonts In Use, CSS Winner, httpster, Siteinspire, and Best Website Gallery.`,
};

// Mock classes data
const mockClasses: ClassCard[] = [
  {
    id: "1",
    title: "Pilates",
    instructor: "Ana",
    time: "1:30 PM - 3:30 PM",
    attendees: [
      { id: "1", name: "Ana", status: "yes" },
      { id: "2", name: "Olivia", status: "yes" },
      { id: "3", name: "Riley", status: "no" },
      { id: "4", name: "Jordan", status: "awaiting" },
    ],
  },
  {
    id: "2",
    title: "Pilates",
    instructor: "Ana",
    time: "1:30 PM - 3:30 PM",
    attendees: [
      { id: "1", name: "Ana", status: "yes" },
      { id: "2", name: "Olivia", status: "yes" },
      { id: "3", name: "Riley", status: "no" },
      { id: "4", name: "Jordan", status: "awaiting" },
    ],
  },
];

// Avatar component
function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return avatar ? (
    <img src={avatar} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
  ) : (
    <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
}

// Avatar group component
function AvatarGroup({ attendees, max = 4 }: { attendees: ClassCard["attendees"]; max?: number }) {
  const displayed = attendees.slice(0, max);
  const remaining = attendees.length - max;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayed.map((attendee) => (
          <div key={attendee.id} className="ring-2 ring-white rounded-full">
            <Avatar name={attendee.name} avatar={attendee.avatar} size="sm" />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="ml-2 text-sm text-gray-500 font-medium">OR</span>
      )}
      <button className="ml-2 w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// Class card component
function ClassCardComponent({ classData }: { classData: ClassCard }) {
  const attendeeCounts = {
    yes: classData.attendees.filter((a) => a.status === "yes").length,
    no: classData.attendees.filter((a) => a.status === "no").length,
    awaiting: classData.attendees.filter((a) => a.status === "awaiting").length,
  };
  const totalAttendees = classData.attendees.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900">{classData.title}</h3>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="w-4 h-4" />
          <span>Instructor: {classData.instructor}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>{classData.time}</span>
        </div>
      </div>

      <div className="mt-4">
        <AvatarGroup attendees={classData.attendees} />
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">{totalAttendees} attendees</span>
          <span className="ml-3">{attendeeCounts.yes} yes</span>
          <span className="ml-3">{attendeeCounts.no} no</span>
          <span className="ml-3">{attendeeCounts.awaiting} awaiting</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/dashboard/classes`}
          className="text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          View class
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const aboutPreviewLength = 300;
  const shouldTruncate = mockUser.about.length > aboutPreviewLength;

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-5xl">
        {/* Header with Avatar and Name */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar name={mockUser.name} avatar={mockUser.avatar} size="xl" />
          <h1 className="text-2xl font-semibold text-gray-900">{mockUser.name}</h1>
        </div>

        {/* Main Content */}
        <div className="flex gap-12">
          {/* Left Column - Contact Info */}
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Location */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{mockUser.locationFlag}</span>
                <span className="text-gray-900">{mockUser.location}</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <a
                href={`mailto:${mockUser.email}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <span>{mockUser.email}</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <a
                href={`tel:${mockUser.phone.replace(/\s/g, "")}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {mockUser.phone}
              </a>
            </div>
          </div>

          {/* Right Column - About and Classes */}
          <div className="flex-1">
            {/* About Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About me</h2>
              <div className="text-gray-600 whitespace-pre-line">
                {shouldTruncate && !isAboutExpanded
                  ? mockUser.about.slice(0, aboutPreviewLength) + "..."
                  : mockUser.about}
              </div>
              {shouldTruncate && (
                <button
                  onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                  className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  {isAboutExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Classes Section */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockClasses.map((classData) => (
                  <ClassCardComponent key={classData.id} classData={classData} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
