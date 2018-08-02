-- Table: public.activity

-- DROP TABLE public.activity;

CREATE TABLE public.activity
(
  activityid integer NOT NULL DEFAULT nextval('activity_activityid_seq'::regclass),
  "time" time without time zone,
  title character varying(20),
  description text,
  author character varying(30),
  CONSTRAINT activity_pkey PRIMARY KEY (activityid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.activity
OWNER TO saeful;


-- Table: public.issues

-- DROP TABLE public.issues;

CREATE TABLE public.issues
(
  issuesid integer NOT NULL DEFAULT nextval('issues_issuesid_seq'::regclass),
  projectid integer,
  tracker character varying(7),
  subject character varying,
  description text,
  status character varying(11),
  priority character varying(9),
  assignee integer,
  startdate date,
  duedate date,
  estimatedate date,
  done smallint,
  file character varying(30),
  spendtime integer,
  targetversion character varying(30),
  author smallint,
  createdate date,
  updateddate date,
  closedate date,
  parenttask integer,
  CONSTRAINT issues_pkey PRIMARY KEY (issuesid),
  CONSTRAINT issues_assignee_fkey FOREIGN KEY (assignee)
  REFERENCES public."user" (userid) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT issues_author_fkey FOREIGN KEY (author)
  REFERENCES public."user" (userid) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT issues_projectid_fkey FOREIGN KEY (projectid)
  REFERENCES public.projects (projectid) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.issues
OWNER TO saeful;

-- Table: public.members

-- DROP TABLE public.members;

CREATE TABLE public.members
(
  id integer NOT NULL DEFAULT nextval('members_id_seq'::regclass),
  userid integer,
  role character varying(7),
  projectid integer,
  CONSTRAINT members_pkey PRIMARY KEY (id),
  CONSTRAINT members_projectid_fkey FOREIGN KEY (projectid)
  REFERENCES public.projects (projectid) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT members_userid_fkey FOREIGN KEY (userid)
  REFERENCES public."user" (userid) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.members
OWNER TO saeful;

-- Table: public.projects

-- DROP TABLE public.projects;

CREATE TABLE public.projects
(
  projectid integer NOT NULL DEFAULT nextval('projects_projectid_seq'::regclass),
  name character varying(30),
  CONSTRAINT projects_pkey PRIMARY KEY (projectid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.projects
OWNER TO saeful;


-- Table: public."user"

-- DROP TABLE public."user";

CREATE TABLE public."user"
(
  userid integer NOT NULL DEFAULT nextval('user_userid_seq'::regclass),
  email character varying(30),
  password character varying(20),
  firstname character varying(15),
  lastname character varying(15),
  CONSTRAINT user_pkey PRIMARY KEY (userid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public."user"
OWNER TO saeful;
