import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { LessonPlan } from '@/types/database';
import {
  CORAL,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  BORDER,
} from '@/lib/utils/brand-colors';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Inter',
    fontSize: 11,
    color: TEXT_PRIMARY,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: CORAL,
    textAlign: 'center',
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: 700,
    color: CORAL,
    marginTop: 16,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
  },
});

function Heading({ children }: { children: string }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

function SubHeading({ children }: { children: string }) {
  return <Text style={styles.subHeading}>{children}</Text>;
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function LessonDocument({ lesson }: { lesson: LessonPlan }) {
  const { content } = lesson;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{content.title || lesson.title}</Text>
        <Text style={styles.meta}>
          {lesson.subject} · {lesson.grade} · {lesson.duration_minutes} minutes
        </Text>

        <Heading>Learning Objectives</Heading>
        {content.objectives.map((o, i) => <Bullet key={i} text={o} />)}

        <Heading>Success Criteria</Heading>
        {content.successCriteria.map((s, i) => <Bullet key={i} text={s} />)}

        <Heading>Key Concepts</Heading>
        {content.keyConcepts.map((k, i) => <Bullet key={i} text={k} />)}

        <Heading>Hook Activity</Heading>
        <Body>{content.hook}</Body>

        <Heading>Main Activities</Heading>
        {content.mainActivities.map((a, i) => <Bullet key={i} text={a} />)}

        <Heading>Guided Practice</Heading>
        {content.guidedPractice.map((g, i) => <Bullet key={i} text={g} />)}

        <Heading>Independent Practice</Heading>
        {content.independentPractice.map((p, i) => <Bullet key={i} text={p} />)}

        <Heading>Formative Assessment</Heading>
        {content.formativeAssessment.map((f, i) => <Bullet key={i} text={f} />)}

        <Heading>Differentiation</Heading>
        <SubHeading>Support</SubHeading>
        {content.differentiation.support.map((s, i) => <Bullet key={i} text={s} />)}
        <SubHeading>Extension</SubHeading>
        {content.differentiation.extension.map((e, i) => <Bullet key={i} text={e} />)}

        <Heading>Real-World Connections</Heading>
        {content.realWorldConnections.map((r, i) => <Bullet key={i} text={r} />)}

        <Heading>Plenary</Heading>
        <Body>{content.plenary}</Body>
      </Page>
    </Document>
  );
}

export async function generatePdf(lesson: LessonPlan): Promise<Buffer> {
  const buffer = await renderToBuffer(<LessonDocument lesson={lesson} />);
  return Buffer.from(buffer);
}
