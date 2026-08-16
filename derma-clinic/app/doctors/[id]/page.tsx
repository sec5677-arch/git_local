import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DOCTORS, getDoctor } from "@/lib/site-data";
import { DoctorProfile } from "@/components/sections/DoctorProfile";

/**
 * Doctor profile route — `/doctors/[id]`.
 *
 * Server component: pre-renders every doctor at build time (static), resolves
 * the doctor by id (404 if unknown), and emits per-doctor metadata. The rich,
 * interactive body is delegated to the `DoctorProfile` client component
 * (scroll reveal + related-treatments interactions).
 */

export function generateStaticParams() {
  return DOCTORS.map((d) => ({ id: d.id }));
}

export const dynamicParams = false;

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const doctor = getDoctor(params.id);
  if (!doctor) {
    return {
      title: "의료진 프로필을 찾을 수 없습니다",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${doctor.name} — ${doctor.role}`,
    description: doctor.bio,
    openGraph: {
      type: "profile",
      title: `${doctor.name} | 세린 피부과`,
      description: doctor.bio,
    },
  };
}

export default function DoctorPage({
  params,
}: {
  params: { id: string };
}) {
  const doctor = getDoctor(params.id);
  if (!doctor) {
    notFound();
  }
  return <DoctorProfile doctor={doctor} />;
}
